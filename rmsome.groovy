#!/usr/bin/env groovy
@GrabResolver(name = 'jitpack', root = 'https://jitpack.io')
@GrabResolver(name = 'central', root = 'http://central.maven.org/maven2/')
@Grab('com.github.nao20010128nao:CryptorageExtras:128a3b8')
import com.nao20010128nao.Cryptorage.ExposedKt as UtilsKt
import com.nao20010128nao.CryptorageExtras.UtilsKt as Extras

def pass = System.env.PASSWORD

def crypt = UtilsKt.withV1Encryption(UtilsKt.asFileSource(new File('./bkup')), pass)

crypt.list().findAll{
  it.endsWith '.ogg'
}.each{
  println "Removing $it"
  crypt.delete it
}

crypt.close()
println 'OK'
