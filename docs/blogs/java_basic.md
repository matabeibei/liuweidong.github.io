# Java基础

## Java值传递
基本数据类型是值传递，对象是共享对象传递，可以理解为值传递的特例，是把对象的地址值拷贝了一份，再传递，所以如果像String这种对象，字符串是不可变的，修改之后是一个新的String，传递的是原来对象的地址拷贝副本，新创建对象后副本指向了新对象，所以不会影响原来的对象（即出了方法之后就失效了）。

## Hashmap
### 结构
1.7是数组+链表，1.8是数组+链表/红黑树，1.7前插法并发情况下扩容会导致循环链表

扩容机制：

capacity 即容量，默认16。

loadFactor 加载因子，默认是0.75。

threshold 阈值。阈值=容量*加载因子。默认12。当元素数量超过阈值时便会触发扩容(X2)。

### put流程：
1.先判断当前node[]是否为空，为空就初始化node[]，默认初始化长度为16；

2.根据key的hash值与node[].size() -1 做&操作，计算出key应该放在node[]数组的index；

3.如果该位置为null，则把key-value设置在该位置的node[]元素；

4.如果该位置不为null，则判断该位置的上是否红黑树，是红黑树按照红黑树的方式遍历在树上找有没有对应的key，有就更新，没有就在树上添加key-value；

5.如果该位置不是红黑树，则对该位置按照链表的方式查找有没有对应key，有就更新没有就添加，添加完之后如果链表长度大于8就转为红黑树，ps：转红黑树的方法里面会判断map的元素个数小于64，则不会转红黑树，通过rehash进行扩容；

6.如果是添加元素的话，最后添加完如果map的元素个数超过阈值也会进行rehash扩容。

### Hashmap红黑树比较细节：
当数组对应位置为红黑树时，对红黑树上的key进行比较，出现hashcode一样，equal不一样的情况，会判断这个key有没有使用Comparable接口，如果没有使用Comparable的话会遍历整棵树，还没有相等使用System.identityHashCode，查询会退化到O(n)，所以使用Comparable（在实现了的情况）会是流程简化很多，提升性能，但是如果Comparable比较也返回相同还是会遍历整棵数，还没有再调用System.identityHashCode 比较，这个要注意。所以总的来说，转为红黑之后，key实现了Comparable接口能提升插入和删除的操作性能，而这个性能的提升是基于大数据量的情况下的，链表的元素个数比较少，提升不明显，所以在转红黑树之后多增加了Comparable（实现了的话）的比较。

- ps：没有实现Comparable或Comparable比较相同的话，会调用System.identityHashCode打破平衡的，返回只能是左或右，确定下次循环是往左还是右，一直找到叶子上面，进行添加元素。

### Hashmap的hash()函数为什么使用key的hashcode与低16位做异或？
做异或是扰动函数，混合原hash值的高位和低位，加大低16位的随机性，要加强低16位随机性是因为计算数组index是跟数组长度-1做&操作，数组长度有限，用不到hashcode的高位，所以使用扰动函数增加低位随机性，减少hash碰撞。

### rehash流程：
1.如果旧容量大于0，则判断有没有到元素个数最大值(2^30)，到了就不扩容了，否则就扩容为之前的2倍；

2.如果旧容量不大于0，则初始化容量为默认的16；

3.然后通过新容量和负载因子计算新阈值；

4.对旧node[]上面的元素进行重新散列放到新扩容的node[]上，并替换旧node[]；

## ConcurrentHashmap

### 加锁机制 
//TODO 

### Size计算方式
jdk1.8推荐用mappingCount(),因为size()里面会判断是否超过int的最大值，超过则返回int最大值；

1.7是先不加锁计算三次，如果一样就返回，不一样再加锁计算；

1.8是通过baseCount和CounterCell累加计算，没有竞争的情况下cas给baseCount+1，出现竞争，竞争失败的线程会去CounterCell[]中获取一个元素，如果为null就创建一个CounterCell，一般给里面的value设置为1，放入到CounterCell[]中，不为null就给value进行cas加1，最后计算size的时候累加。

- 原因：ConcurrentHashMap是采用CounterCell数组来记录元素个数的，像一般的集合记录集合大小，直接定义一个size的成员变量即可，当出现改变的时候只要更新这个变量就行。为什么ConcurrentHashMap要用这种形式来处理呢？ 问题还是处在并发上，ConcurrentHashMap是并发集合，如果用一个成员变量来统计元素个数的话，为了保证并发情况下共享变量的的安全，势必会需要通过加锁或者自旋来实现，如果竞争比较激烈的情况下，size的设置上会出现比较大的冲突反而影响了性能，所以在ConcurrentHashMap采用了分片的方法来记录大小

### 1.8的put流程
- 核心：为null cas，hash冲突锁住首节点

1.key-value判空，有一个为空报空指针；

2.死循环遍历node[]，如果node[]为空则进行初始化；

3.对key进行散列（方式和Hashmap一样），找到node[]中对应位置，如果该位置为null，则使用cas方式设置值，设置失败重新循环；

4.如果对应位置有元素了，则用syn锁住头节点，对该位置进行遍历，如果是链表就以链表方式进行查找，有就更新，没有就添加；

5.如果是红黑树，就用红黑树的方式的进行查找设置值；

6.结束之后判断链表长度是否大于8，则转成红黑树（也会和Hashmap一样判断元素是否到达64，没到达的话就resize）；

7.添加count。

## Threadlocal
threadlocal里面有个内部类threadlocalmap，每个thread里面都维护了一个threadlocalmap，从本质上来讲就是每个线程有一个map，这个map的key就是当前这个threadlocal，value就是我们设置进去的值，每次get的时候都是从自己的threadlocalmap里面取值，所以不存在线程安全问题，总体来说threadlocal只是充当一个这个map的key的作用，并给每个线程提供一个threadlocalmap的初始值。