#!/usr/bin/env groovy
@GrabResolver(name = 'jitpack', root = 'https://jitpack.io')
@GrabResolver(name = 'central', root = 'http://central.maven.org/maven2/')
@Grab('com.github.nao20010128nao:CryptorageExtras:128a3b8')
@Grab('com.github.nao20010128nao:HttpServerJava:4582a9d30f')
import com.nao20010128nao.Cryptorage.ExposedKt as UtilsKt
import com.nao20010128nao.CryptorageExtras.UtilsKt as Extras
import com.nao20010128nao.CryptorageExtras.indexer.IndexedKt

def pass = System.env.PASSWORD
def data=System.env.VIDEOS_PREFIX?:"data"
def master=System.env.VIDEOS_PREFIX?:"master"
def endpoint=System.env.ENDPOINT

def base
if(args){
  def num=args[0]
  if(num=="local"){
    fs = UtilsKt.asFileSource(new File("bkup"))
  }else{
    fs = UtilsKt.asFileSource(
      new URL("$endpoint/$data-$num/raw/master")
    )
  }
  base = UtilsKt.withV1Encryption(fs, pass)
}else{
  def dir=UtilsKt.asFileSource(
    new URL("$endpoint/indexed/raw/$master")
  )
  base=IndexedKt.withV1IndexedEncryption(dir,pass,false)
}

def crypt = UtilsKt.asFileSource(new File("."))

base.list().each{
  println "Repairing $it"
  try{
    base.open(it).copyTo crypt.put(it)
  }catch(Throwable e){
    e.printStackTrace()
  }
}

crypt.close()
println "OK"
