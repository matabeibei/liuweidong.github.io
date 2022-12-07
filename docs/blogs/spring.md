# Spring

## IOC的流程
**流程**

1.先根据配置的资源路径（可以是`文件路径`、`url路径`）加载到`resource`中；

2.对`resource`中的资源文件进行解析，解析成`dom对象`；

3.对`dom对象`根据spring的xml语义进行解析，解析成`BeanDifinition`，并把BeanDifinition注册到ioc容器中。这个BeanDifinition就是对bean的定义、依赖描述，如classname、bean类型、init方法销毁方法；

4.根据`BeanDifinition`对bean进行实例化并进行依赖注入。这里有两种场景：a.在调用getBean时获取  b.在ioc初始化完成之后进行（lazy-init=false，默认true）

**备注**：IOC可以使用BeanDifinition，也可以使用`@AutoWired`和`@Resource`，使用`@AutoWired`和`@Resource`是ioc容器通过反射找到属性的类型和名称，然后通过类型和名称在容器中查找bean，然后进行依赖注入。

`@AutoWired`：默认使用类型来查找，如果要使用名称可以配合Qualifier，允许为null可以设置required为false；

`@Resource`：先是用名称查找，如果找不到再用类型进行查找，如果指定了属性名就只会按名称来查找；

**使用Java代码代替xml配置文件的原理**：`@Configuration`注解的类就相当于一个XML文件，`@Bean`注解的方法就相当于xml里面的`<bean>`标签，`@Configuration`注解的类在扫描的时候会加载到`BeanDifinition`，然后`ConfigurationClassPostProcessor`后置处理器的enhanceConfigurationClasses()会对`@Configuration`标记的类进行增强：用cglib生成`@Configuration`注解类的代理类，代理类中对`@Bean`注解的方法进行了增强，在需要一个@Bean注解定义的bean时，会执行增强后的方法：在容器中查找有没有这个bean，有就直接返回，没有就调用原生方法生成一个bean再返回。从而达到替换xml的目的。

## springboot启动流程

## springboot自动配置学习
我们整合一些组件的时候，我们会引入一些`Starter`，这些starter的`pom`会引入该组件需要的依赖包，其中有一个依赖包是该组件的`AutoConfiure`包，这个包中有`meta-inf/spring.factories`文件，这个文件中有配置该组件的自动配置类；

springboot启动类中的`@EnableAutoConfig`注解会扫描所有依赖组件的`meta-inf/spring.factories`文件（@EnableAutoConfiguration注解内使用到了@import注解来完成导入配置的功能，而EnableAutoConfigurationImportSelector内部则是使用了SpringFactoriesLoader.loadFactoryNames方法进行扫描具有META-INF/spring.factories文件的jar包），加载文件中配置的自动配置类，这些配置类中通过`@Configuration` 、`@Bean`注解加载组件的bean到ioc容器中，这些bean需要一些地址端口等配置，（通过PackageImport 可以扫描 AutoConfiure包中的bean），AutoConfiure包中的bean通过`@ConfigurationProperties`和`@EnableConfigurationProperties`加载配置文件中配置设置到组件bean的属性中，从而完成自动配置。

## spring bean的生命周期

## spring 的AOP实现方式理解

AOP的核心实现其实是在执行`BeanPostProcessor`的`postProcessorAfterInitialization()`里面实现的，整体流程如下：

首先启动类的`@EnableAspectJAutoProxy`注解会在容器中注入一个`AnnotationAwareAspectJAutoProxyCreator`的bean，这个bean是实现了BeanPostProcessor的，所以BeanPostProcessor的beanPostProcessorBeforeInstantiation会在拦截所有的bean，然后调用到`postProcessorAfterInitialization()`，这个方法中会调用`wrapIfNecessary()`，wrapIfNecessary()中会根据增强器表达式匹配增强器判断是否需要进行代理增强，需要增强就使用proxyFactory传入增强器和目标类，proxyFactory根据是否接口、是否配置cglib来判断使用jdk动态代理还是cglib代理生成代理类并返回，生成完成后再从容器中获取bean时获取到的就是被增强的代理类了。

## spring循环依赖解决方式

**核心**：三级缓存

**核心对象**：

`SingletonObjects`： 单例缓存池 里面存放的是完整的对象

`EarlySingletonObjects`：  创建中的bean的缓存(提前曝光)

`SingletonFactories`：  Map<String, ObjectFactory<?>> 对象工厂

**流程**：

1.先在一级缓存查找

2.一级缓存没有去二级缓存查询

3.二级缓存没有去三级缓存获取对象工厂，在通过工厂的getObject()创建，此时创建是还没有属性注入的

4.然后把创建的对象放到缓存中提前曝光

5.完成属性赋值后创建完成再从二级缓存放到一级缓存中，后续获取的就是完整对象

**举例**：A->B  B->A

在一级缓存中找A，没有去二级缓存，也没有，去三级缓存获取并放到二级缓存中提前曝光A，然后对属性B注入

在一级缓存中找B，没有去二级缓存，也没有，去三级缓存获取并放到二级缓存中提前曝光B，然后B中的属性A注入，一级缓存没有，去二级缓存查找，二级缓存中有提前曝光的A，所以能从二级缓存中获取到A，然后注入，B完成创建就会放到一级缓存中，然后方法返回B回到A的属性注入，给A注入B，此时A也完成创建放入一级缓存，从而解决循环依赖。

**备注**：三级缓存不能解决【构造注入的循环依赖】和【prototype  field属性注入循环依赖】
