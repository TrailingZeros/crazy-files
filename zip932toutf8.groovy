#!/usr/bin/env groovy

import java.util.zip.*
import java.nio.charset.*

def bytes=new byte[8192]

args.toList().each{
  def infile=it
  def slashed=infile.split(File.separator).toList()
  def lastPart=slashed.last()
  def fn=lastPart.substring(0, lastPart.lastIndexOf('.'))+"-utf8"
  def allParts=slashed.subList(0,slashed.size()-1)+[fn+"."+lastPart.substring(lastPart.lastIndexOf('.')+1)]
  def outfile=allParts.join(File.separator)
  println("$infile -> $outfile")
  def inF=new File(infile)
  def outF=new File(outfile)
  new ZipInputStream(inF.newInputStream(),Charset.forName('ms932')).withCloseable{inStream->
    new ZipOutputStream(outF.newOutputStream()).withCloseable{outStream->
      def entry
      while((entry=inStream.nextEntry)!=null){
        println("Recovering $entry.name")
        entry=new ZipEntry(entry.name)
        outStream.putNextEntry(entry)
        while(true){
          def r=inStream.read(bytes)
          if(r<=0)break
          outStream.write(bytes,0,r)
        }
      }
    }
  }
}
