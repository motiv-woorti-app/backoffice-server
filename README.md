The MIT License (MIT)

Copyright (c) 2017-2020 MoTiV project (motivproject.eu)

Permission is hereby granted, free of charge, to any person obtaining a copy of this 
software and associated documentation files (the ""Software""), to deal in the Software 
without restriction, including without limitation the rights to use, copy, modify, 
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to 
permit persons to whom the Software is furnished to do so, subject to the following 
conditions:

The above copyright notice and this permission notice shall be included in all copies 
or substantial portions of the Software.

THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR 
THE USE OR OTHER DEALINGS IN THE SOFTWARE.

(C) 2017-2020 - The Woorti app is a research (non-commercial) application that was
developed in the context of the European research project MoTiV (motivproject.eu). The
code was developed by partner INESC-ID with contributions in graphics design by partner
TIS. The Woorti app development was one of the outcomes of a Work Package of the MoTiV
project.
 
The Woorti app was originally intended as a tool to support data collection regarding
mobility patterns from city and country-wide campaigns and provide the data and user
management to campaign managers.
 
The Woorti app development followed an agile approach taking into account ongoing
feedback of partners and testing users while continuing under development. This has
been carried out as an iterative process deploying new app versions. Along the 
timeline, various previously unforeseen requirements were identified, some requirements
were revised, there were requests for modifications, extensions, or new aspects in
functionality or interaction as found useful or interesting to campaign managers and
other project partners. Most stemmed naturally from the very usage and ongoing testing
of the Woorti app. Hence, code and data structures were successively revised in a
way not only to accommodate this but, also importantly, to maintain compatibility with
the functionality, data and data structures of previous versions of the app, as new
version roll-out was never done from scratch.

The code developed for the Woorti app is made available as open source, namely to
contribute to further research in the area of the MoTiV project, and the app also makes
use of open source components as detailed in the Woorti app license. 
 
This project has received funding from the European Union’s Horizon 2020 research and
innovation programme under grant agreement No. 770145.

This work is partially described in peer-reviewed scientific publication, as for 
reference in publications when used in other works:

edgeTrans - Edge transport mode detection. P. Ferreira, C. Zavgorodnii, L. Veiga. 
Pervasive and Mobile Computing, vol. 69(2020), 101268, ISSN 1574-1192, Elsevier.
https://doi.org/10.1016/j.pmcj.2020.101268

# Motiv server and backoffice setup

In the following steps you need to define the following passwords:

ORIENTDB_PASSWORD    

MONGODB_PASSWORD 




## ORIENTDB INSTALLATION TUTORIAL:


I) Install Java (adapted from: https://www.tecmint.com/install-java-jdk-jre-in-linux/):

[Version used in motiv - 8.0_201; Do not install java above version 8, because orientdb will execute some code in different way]

The link do download java in some of the commands may be outdated. Replace by a current one.

```
sudo mkdir /opt/java && cd /opt/java

sudo wget --no-cookies --no-check-certificate --header "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/8u161-b12/2f38c3b165be4555a1fa6e98c45e0808/jdk-8u161-linux-x64.tar.gz

sudo tar -zxvf jdk-8u161-linux-x64.tar.gz

cd jdk1.8.0_161/

sudo update-alternatives --install /usr/bin/java java /opt/java/jdk1.8.0_161/bin/java 100

sudo update-alternatives --config java

sudo update-alternatives --install /usr/bin/javac javac /opt/java/jdk1.8.0_161/bin/javac 100

sudo update-alternatives --config javac

sudo update-alternatives --install /usr/bin/jar jar /opt/java/jdk1.8.0_161/bin/jar 100

sudo update-alternatives --config jar
```


Open the file /etc/profile (ex: sudo nano /etc/profile) and at the end of the file add the following lines:

```
export JAVA_HOME=/opt/java/jdk1.8.0_161/
export JRE_HOME=/opt/java/jdk1.8.0_161/jre
export PATH=$PATH:/opt/java/jdk1.8.0_161/bin:/opt/java/jdk1.8.0_161/jre/bin
```

(These environment variables will be defined after reboot)



II) Install OrientDB (adapted from:
                                    https://orientdb.com/docs/last/Unix-Service.html
                                    http://www.famvdploeg.com/blog/2013/01/setting-up-an-orientdb-server-on-ubuntu/):
(Download page: https://orientdb.com/download-previous/)


```
cd /opt

sudo wget https://s3.us-east-2.amazonaws.com/orientdb3/releases/3.0.17/orientdb-3.0.17.tar.gz -O orientdb-community-3.0.17.tar.gz

sudo tar xvzf orientdb-community-3.0.17.tar.gz

cd /opt/orientdb-community-3.0.17/config

```

Open orientdb-server-config.xml file (ex: sudo nano orientdb-server-config.xml)

Inside <orient-server> tag find the <properties> tag.

After this add new propertie:
    <entry name="network.binary.maxLength" value="1000000"/>



### To run the orientdb:

```
cd /opt/orientdb-community-3.0.17/bin

sudo ./server.sh
```

Configure the password for root account (indroduce your orientdb password):
    password: ORIENTDB_PASSWORD


### To restore orientdb backup:

First of all you need to create a database using console or studio.

For example, using the studio (https://orientdb.org/docs/3.0.x/studio/), do:


```
sudo ./server.sh
```

In your browser go to http://localhost:2480/

Click on "New DB" and fill the forms with following information:

Databse name     : MotivDatabase
Server user      : root
Server Password  : ORIENTDB_PASSWORD

Click on "Create database"

In order to restore a database you must close the orientdb (server.sh).

After this open the console:


```
cd /opt/orientdb-community-3.0.17/bin
sudo ./console.sh

```

In the console do:


```
connect plocal:../databases/MotivDatabase admin admin

restore database PATH_TO_ORIENDB_BACKUP
```

(PATH_TO_ORIENDB_BACKUP must point to .zip file, e.g.: MotivDatabase-20190522030500.zip)

After restoring, close the console with: exit

P.S: restore command in orientdb replaces the existing db completely.

P.S.2: using studio login to MotivDatabase database to check the existing schema and functions that manipulates the orientdb data.



### SOME ISSUES OR OPTIONAL STEPS:

### If you have the following error when running the ./server.sh (or from orientdb.sh):


```
    Unrecognized option: -d64
    Error: Could not create the Java Virtual Machine.
    Error: A fatal exception has occurred. Program will exit.
```

-d64 flag is used to specify the 64bit environment. Assuming you installed the 64bit version of Java, this option is redundant.
Open the server.sh file with text editor, go to the end of the file.
Find the line "exec -d64 "$JAVA" $JAVA_OPTS \" and replace it with "exec "$JAVA" $JAVA_OPTS \"


### To run the orientdb service after system boot (optional):


```
    cd /opt/orientdb-community-3.0.17/bin
    
```
Open the file orientdb.sh (ex: sudo nano orientdb.sh):
    
IMPORTANT: Add the following lines between the first line ( #!/bin/sh ) and the second line ( # OrientDB service script ):

```
        ### BEGIN INIT INFO
        # Provides:          orientdb
        # Required-Start:    $ALL
        # Required-Stop:     $remote_fs $syslog
        # Default-Start:     2 3 4 5
        # Default-Stop:      0 1 6
        # Short-Description: Start daemon at boot time
        # Description:       Enable orientdb services provided by daemon.
        ### END INIT INFO
        
```
    

    The result should look like:
        #!/bin/sh
        ### BEGIN INIT INFO
        ...
        ### END INIT INFO
        # OrientDB service script
        ...

    
    Replace the following lines:

    ORIENTDB_DIR="YOUR_ORIENTDB_INSTALLATION_PATH"        --> path to the orientdb folder
    ORIENTDB_USER="USER_YOU_WANT_ORIENTDB_RUN_WITH"        --> user created with useradd command

    With:

    ORIENTDB_DIR="/opt/orientdb-community-3.0.17"
    ORIENTDB_USER="root"


```
    sudo cp /opt/orientdb-community-3.0.17/bin/orientdb.sh /etc/init.d/orientdb

    cd /etc/init.d

    sudo update-rc.d orientdb defaults
    
```

    After reboot, the system will run the orientdb service




### To remove the Guest account, do (optional):


```
cd /opt/orientdb-community-3.0.17/config

```

Open orientdb-server-config.xml file (ex: sudo nano orientdb-server-config.xml)

go down, until <users> section

remove the line that contains user with name "guest"

( example of line: 
    <user resources="connect,server.listDatabases,server.dblist" password="{PBKDF2WithHmacSHA256}52B211DFDE367BD3415B8E0685E0A504AF29269133CEFFA3:1C0F5B755DA637C048DE185813E51D7AC59E40484F0270CE:65536" name="guest"/>
)





## Mongodb installation tutorial:


Install MongoDB Community Edition (from: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/):

[Version used in motiv - 3.6.9]


(confirm that the key are the same for the next command!)


```
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5

echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list

sudo apt-get update

sudo apt-get install -y mongodb-org 

```
    
  (or, to install a specific version, say 3.6.3: sudo apt-get install -y mongodb-org=3.6.3 mongodb-org-server=3.6.3 mongodb-org-shell=3.6.3 mongodb-org-mongos=3.6.3 mongodb-org-tools=3.6.3 )


After this it is necessary to configure the authentication on mongo (adapted from https://docs.mongodb.com/manual/tutorial/enable-authentication/):


```
run mongodb with: sudo service mongod start

```

open mongo shell with: 

```
mongo
```

In mongo shell do:


```
use admin

db.createUser({user: "root", pwd: "MONGODB_PASSWORD", roles: [{role: "userAdminAnyDatabase", db: "admin"}, {role: "root", db: "admin"}]})

```
close the mongo shell with: 

```
exit

```

Open the mongo configuration file (by default is /etc/mongod.conf) and add the following lines:

security:
  authorization: "enabled"


Restart the mongodb with: 

```
sudo service mongod restart

```

Now you can access the mongo shell providing username/password with:

```
mongo -u "root" -p "MONGODB_PASSWORD" --authenticationDatabase "admin" 
```



### To restore mongodb backup:

To to the folder with mongodb backups (which contains motiv_campaign, motiv_surveys and motiv_users folders) and run:

```
sudo mongorestore -d motiv_users motiv_users -u "root" -p "MONGODB_PASSWORD" --authenticationDatabase "admin"
sudo mongorestore -d motiv_campaign motiv_campaign -u "root" -p "MONGODB_PASSWORD" --authenticationDatabase "admin"
sudo mongorestore -d motiv_surveys motiv_surveys -u "root" -p "MONGODB_PASSWORD" --authenticationDatabase "admin"
```


P.S: restore command in mongodb doesn't replace the existing db completely, but makes merge of both.



--- To run the mongod service after system boot (optional):

    During the installation the Systemd service of mongod is already created (check with: sudo service mongod status   OR   sudo systemctl status mongod.service).

    In order to run this service on boot, run the following command:

```
    sudo systemctl enable mongod.service
```




## SERVER AND BACKOFFICE INSTALLATION TUTORIAL:


### Install nodejs (from: https://nodejs.org/en/download/package-manager/ ):

[Version used in motiv - 8.15.1]


```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

sudo apt-get install -y nodejs

sudo apt-get install -y build-essential
```



### Install Angular Cli:

```
sudo npm install -g @angular/cli@6.0.0

```





## SERVER AND BACKOFFICE SETUP TUTORIAL:

### motiv-server project:


Generate a firebase_admin.json.

Go to server_api/authentication and replace "./server_firebase_admin.json" by the file path.


### Run the server:

You need to have mongodb and orientdb running before launching the server (make sure you already restored backups of mongodb and orientdb).

```
    sudo service mongod start -> launch the mongodb
    sudo ORIENTB_FOLDER/bin/server.sh -> launch the orientdb
```


go to Motiv server project folder (motiv-server)

```
npm install
```


To run the project after installation:

```
npm start - to run the project on a local machine

npm startHttps - to run the project in production mode as a server (https keys and certificates must be configured first!)
```

Configure certificate path in app.js and package.json




----- server url configuration: -----

Server (motiv-server project) url is defined in motiv-webapp/src/app/providers/server-communication.service.ts file, line 26.

Current URL assumes that the server is running on https://app.motiv.gsd.inesc-id.pt and port 8000. Adapt the url if the server is running on another host/port.




### motiv-webapp project:

### Run the webapp:

cd to Motiv web application project folder (motiv-webapp)

```
npm install

npm start - to run the project on a local machine
```

To run the web app in a production mode, you need to do:

```
ng build - This command will generate the dist/ filder in motiv-webapp folder. 

mv /dist motiv-server (copy dist/ folder inside motiv-server folder)
```

In production mode the web app is served by motiv-server as a static site.

To configure api_url go to server-communication.service.ts




