#!/usr/bin/env groovy
@GrabResolver(name = 'jitpack', root = 'https://jitpack.io')
@GrabResolver(name = 'central', root = 'http://central.maven.org/maven2/')
@Grab('com.github.nao20010128nao:CryptorageExtras:128a3b8')
import com.nao20010128nao.Cryptorage.ExposedKt as UtilsKt
import com.nao20010128nao.CryptorageExtras.UtilsKt as Extras

List.metaClass.execute2={->
  def pb=new ProcessBuilder(delegate.collect{it.toString()})
  pb.inheritIO()
  return pb.start()
}

def twuser(tweet){
  ["./.resolvetwuser",tweet].execute().in.text.trim()
}

def inspect(num){
  ["./inspect",num].execute2().waitFor()
}

def send(){
  ["./send_single.sh"].execute2().waitFor()
}

def list(){
  ["./list"].execute().in.text.trim().readLines()
}

def list(num){
  ["./list",num].execute().in.text.trim().readLines()
}

def openLocal(){
  def pass=System.env.PASSWORD
  def fs = UtilsKt.asFileSource(new File("bkup"))
  return UtilsKt.withV1Encryption(fs, pass)
}

def twfile= ~'^Twitter-(.+)-([0-9]+)\\.(mp4|webm)$'
def arcvfile= ~'^([0-9A-Za-z]{5})(?:-utf8)?\\.zip$'

def twresolved=[:]

list().each{n->
  def m=twfile.matcher(n)
  if(m.find()){
    def display=m.group(1)
    if(twresolved[display])return
    def tweetId=m.group(2)
    def resolved=twuser(tweetId)
    if(display!=resolved && resolved){
      println n
      twresolved[display]=resolved
    }
  }
}

println twresolved

def begin=Integer.parseInt(args?args[0]:"1");

for(def i=begin;i<165;i++){
  def flag=false
  list("$i").each{n->
    if(twfile.matcher(n).find()){
      flag=true
    }
    if(arcvfile.matcher(n).find()){
      flag=true
    }
  }
  if(!flag)continue
  println i
  inspect "$i"
  openLocal().withCloseable{t->
    t.list().each{n->
      def m=twfile.matcher(n)
      if(m.find()){
        def display=m.group(1)
        if(!twresolved[display])return
        def tweetId=m.group(2)
        def extension=m.group(3)
        def resolved=twresolved[display]
        def newName="Twitter-$resolved-$tweetId.$extension"
        t.mv(n,newName)
        println "$n -> $newName"
      }
      m=arcvfile.matcher(n)
      if(m.find()){
        def name=m.group(1)
        def newName="archiveis-${name}.zip"
        t.mv(n,newName)
        println "$n -> $newName"
      }
    }
  }
  send()
}
