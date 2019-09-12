#!/usr/bin/env groovy
@GrabResolver(name = 'jitpack', root = 'https://jitpack.io')
@GrabResolver(name = 'central', root = 'http://central.maven.org/maven2/')
@Grab('com.github.nao20010128nao:CryptorageExtras:128a3b8')
@Grab('org.apache.ftpserver:ftpserver-core:1.1.1')
@Grab('com.github.nao20010128nao:FtpServerHelper:74babbfaf9')
//@Grab('org.slf4j:slf4j-simple:1.7.28')

import com.nao20010128nao.Cryptorage.ExposedKt as UtilsKt
import com.nao20010128nao.CryptorageExtras.UtilsKt as Extras
import com.nao20010128nao.CryptorageExtras.indexer.IndexedKt
import org.apache.ftpserver.listener.*
import org.apache.ftpserver.*
import com.nao20010128nao.FtpHelper.*

//System.properties["org.slf4j.simpleLogger.defaultLogLevel"]="debug"

def crypt
def data=System.env.VIDEOS_PREFIX?:"data"
def master=System.env.VIDEOS_PREFIX?:"master"
def endpoint=System.env.ENDPOINT

if(System.env.SLOW){
  def storages=[]
  def quicktest=false
  for(def num=1;num<=150;num++){
    try{
        print("...$num")
        def dir=UtilsKt.asFileSource(new URL("$endpoint/$data-$num/raw/master"))
        def crypto=UtilsKt.withV1Encryption(dir, System.env.PASSWORD)
        quicktest|=crypto.has("aaaa.mp4.000.split")
        storages+=crypto
    }catch(Throwable e){
        print "!"
        //e.printStackTrace()
      }
  }
  crypt=Extras.withSplitFilesCombined(Extras.logged(UtilsKt.combine(storages),"before-combine"))
  println(quicktest)
}else{
  def dir=UtilsKt.asFileSource(new URL("$endpoint/indexed/raw/$master"))
  //dir=Extras.logged(dir,'source')
  crypt=IndexedKt.withV1IndexedEncryption(dir,System.env.PASSWORD,false)
}

def listener = new ListenerFactory()
listener.port=9035
listener.dataConnectionConfiguration=new DataConnectionConfigurationFactory().createDataConnectionConfiguration()

def connection = new ConnectionConfigFactory()
connection.maxLoginFailures=100
connection.loginFailureDelay=10
connection.anonymousLoginEnabled=false

def serverFactory = new FtpServerFactory()
serverFactory.userManager=new QuickUserManager([
    lesmi:"114514"
])

def view=Extras.forFtpServer(crypt)

/*
serverFactory.fileSystem={user->([
    getHomeDirectory:view.&getHomeDirectory,
    getWorkingDirectory:view.&getWorkingDirectory,
    changeWorkingDirectory:view.&changeWorkingDirectory,
    getFile:{fn->
      println "Request: $fn"
      def ret= view.&getFile(fn)
      println "Got: $ret.name"
      return ret
    },
    isRandomAccessible:view.&isRandomAccessible,
    dispose:view.&dispose
]) as org.apache.ftpserver.ftplet.FileSystemView}
*/
serverFactory.fileSystem=view
serverFactory.addListener("default", listener.createListener())
serverFactory.connectionConfig=connection.createConnectionConfig()

def server= serverFactory.createServer()
server.start()

println 'Ready'

//println view.workingDirectory.listFiles()*.name