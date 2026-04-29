

## Kafka Cluster and Zookeeper cluster setup 

### Step 1 - Setup zookeeper

1. Download and setup Java 11+
2. Download Zookeeper from `https://archive.apache.org/dist/zookeeper/zookeeper-3.5.7/`     
    - Download link `https://archive.apache.org/dist/zookeeper/zookeeper-3.5.7/apache-zookeeper-3.5.7-bin.tar.gz`
3. Uncompress and make 3 copy(You can make any number of intances) of same folder.
4. Create tmp folder in same directory or use system's tmp directory
    4.1 - Add zookeeper-X and Kafka-logs-X folder to write logs, X refers to 1,2,3 eg: zookeeper-1,zookeeper-2,zookeeper-3,Kafka-logs-1,Kafka-logs-2,Kafka-logs-3
    4.2 - Inside the zookeeper-X create a file myid and add X in the file by command
        `$ echo >myid X`  -—> This will create a file name myid and add X in that file again X will be replaced by 1,2,3
5. Setup config file for each instanch inside the `conf` folder and create a file `zoo.cfg`
    5.1 - zoo.cfg file 
    ```
        tickTime=2000
        initLimit=10
        syncLimit=5
        dataDir=/Users/daffolap-63/Documents/kafka/tmp/zookeeper-1
        clientPort=2181
        maxClientCnxnx=60

        4lw.commands.whitelist=*

        Server.1=localhost:2788:3788
        Server.2=localhost:2888:3888
        Server.3=localhost:2988:3988
    ```
6. Run the zookeeper. For each instance.
command `$ bin/zkServer.sh start-foreground` or you can use  `$ bin/zkServer.sh start` for background
### Start zookeeper
`$ ./apache-zookeeper-3.5.7-bin-1/bin/zkServer.sh start` 
`$./apache-zookeeper-3.5.7-bin-2/bin/zkServer.sh start`
`$ ./apache-zookeeper-3.5.7-bin-3/bin/zkServer.sh start`

### Stop zookeeper
`$ apache-zookeeper-3.5.7-bin-1/bin/zkServer.sh stop` 
`$ apache-zookeeper-3.5.7-bin-2/bin/zkServer.sh stop` 
`$ apache-zookeeper-3.5.7-bin-3/bin/zkServer.sh stop` 

### Step 2 Setup Kafka Cluster 

1. Download latest kafka binary from Apache.org
    - Download link `https://www.apache.org/dyn/closer.cgi?path=/kafka/2.7.0/kafka_2.13-2.7.0.tgz`
2. Uncompress and make 3 copy(You can make any number of intances) of same folder.
3. Change the server.properties file inside the config folder and update 
    3.1 Change broker id `broker.id=1` eg: 1,2,3 whatever the zookeepers you have
    3.2 Add listeners for all folders format - `listeners=listener_name://host_name:port` eg: listeners=PLAINTEXT://localhost:9092/93/94
    3.3 update log.dirs `log.dirs=/tmp/kafka-logs-X`, kafka-logs-1, kafka-logs-2, kafka-logs-3
    3.4 update and add zookeeper.connect `zookeeper.connect=localhost:2181,localhost:2182,localhost:2183`
### Start kafka server
`$ kafka_2.13-2.7.0-1/bin/kafka-server-start.sh -daemon kafka_2.13-2.7.0-1/config/server.properties`
`$ kafka_2.13-2.7.0-2/bin/kafka-server-start.sh -daemon kafka_2.13-2.7.0-2/config/server.properties`
`$ kafka_2.13-2.7.0-3/bin/kafka-server-start.sh -daemon kafka_2.13-2.7.0-3/config/server.properties`

### Stop Kafka server 
`$ kafka_2.13-2.7.0-1/bin/kafka-server-stop.sh`
`$ kafka_2.13-2.7.0-2/bin/kafka-server-stop.sh`
`$ kafka_2.13-2.7.0-3/bin/kafka-server-stop.sh`


## Kafka-manager  Setup
1. Download from `GitHub.com/yahoo/CMAK`
2. cd path/to/downloaded/folder 
3. run `$ .sbt/clean dist`
4. run `$ cd kafka-manager/target/universal`
5. run `$ unzip cmak-3.0.0.5.zip` 
6. run `$ cd cmak-3.0.0.5`
7. run `$ vi conf/application.conf` and update
    cmac.zkhosts=“localhost:2181”
8. run `$ bin/cmac -Dconfig.file=conf/application.conf -Dhttp.port=8080`
9. Open browser and browse localhost:8080
10. Add cluster in Kafka manager
    Cluster name, 
    ZKhost:iP of clusterts with comma separated, 
    enable poll consumer information
11. Save the information and view your cluster.
