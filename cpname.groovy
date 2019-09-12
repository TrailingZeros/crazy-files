#!/usr/bin/env groovy
@GrabResolver(name = 'jitpack', root = 'https://jitpack.io')
@GrabResolver(name = 'central', root = 'http://central.maven.org/maven2/')
@Grab('com.github.nao20010128nao:CryptorageExtras:128a3b8')
@Grab('com.github.nao20010128nao:HttpServerJava:4582a9d30f')
import com.nao20010128nao.Cryptorage.ExposedKt as UtilsKt
import com.nao20010128nao.CryptorageExtras.UtilsKt as Extras
import com.nao20010128nao.CryptorageExtras.indexer.IndexedKt

def pass = System.env.PASSWORD
def master=System.env.VIDEOS_PREFIX?:"master"
def endpoint=System.env.ENDPOINT

def regexes=args.toList().collect{~it}

def dir=UtilsKt.asFileSource(
  new URL("$endpoint/indexed/raw/$master")
)
def base=IndexedKt.withV1IndexedEncryption(dir,pass,false)

def crypt = UtilsKt.asFileSource(new File("."))

def dls=base.list().toList().findAll{
  regexes.any{rg->rg.matcher(it).matches()} || args.any{aa->it.contains(aa)}
}.sort()

dls.each{
  println "Repairing $it"
  try{
    base.open(it).copyTo crypt.put(it)
  }catch(Throwable e){
    e.printStackTrace()
  }
}

crypt.close()
println "OK"
