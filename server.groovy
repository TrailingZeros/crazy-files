#!/usr/bin/env groovy
@GrabResolver(name = 'jitpack', root = 'https://jitpack.io')
@GrabResolver(name = 'central', root = 'http://central.maven.org/maven2/')
@Grab('com.github.nao20010128nao:CryptorageExtras:128a3b8')
@Grab('com.github.nao20010128nao:HttpServerJava:4582a9d30f')
import com.nao20010128nao.Cryptorage.ExposedKt as UtilsKt
import com.nao20010128nao.CryptorageExtras.UtilsKt as Extras
import com.nao20010128nao.CryptorageExtras.indexer.IndexedKt
import net.freeutils.httpserver.HTTPServer

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

HTTPServer.addContentType("video/mp4", "mp4")
HTTPServer.addContentType("video/webm", "webm")

def server = new HTTPServer(9034)

def files = crypt.list().toList().sort()
Collections.sort(files, String.CASE_INSENSITIVE_ORDER)
println(files.size())

server.getVirtualHost(null).with {
    addContext('/') { req, resp ->
        def path = req.path
        if (path.startsWith('/')) path = path.substring(1)
        println "Requested: $path"
        try {
            path = new String(path.split('/').last().split('\\.').first().decodeHex())
        } catch (Throwable e) {
        }
        try {
            if (!files.contains(path)) {
                println 'Sending index'
                resp.sendHeaders(200)
                resp.body.write '''
<html>
<head>
<title>Index of /</title>
</head>
<body>
<h1>Index of /</h1>
<hr />
'''.bytes
                def toSend = files
                if (path && !path.contains("index")) {
                    toSend = files.findAll { it.toLowerCase().contains(path.toLowerCase()) }
                }
                toSend.each {
                    //println it
                    def inName = it.bytes.encodeHex().toString()
                    if (it.contains('.')) {
                        inName += '.'
                        inName += it.split('\\.').last()
                    }
                    resp.body.write """
<a href="/${inName}">$it</a><br />
""".bytes
                }
                resp.body.write '''
</body>
</html>
'''.bytes
                return
            }
        } catch (Throwable e) {
            e.printStackTrace()
        }
        try {
            def start = 0
            def length = -1
            println 'Sending content'
            if (req.headers.contains("Range")) {
                def range = req.headers.get("Range")
                println "Range: $range"
                assert range.startsWith("bytes=")
                def bytes = range.substring(6).split("-").findAll()
                start = Integer.valueOf(bytes[0])
                if (!range.endsWith("-")) {
                    length = Integer.valueOf(bytes[1]) - start
                }
            }

            resp.headers.add("Accept-Ranges", "bytes")
            resp.sendHeaders(
                start == 0 ? 200 : 206,
                length == -1 ? (crypt.size(path) - start) : length,
                crypt.lastModified(path),
                null,
                HTTPServer.getContentType(path, null),
                length == -1 ? null : ([start, start + length - 1, crypt.size(path)] as long[])
            )

            def source = crypt.open(path, start)
            if (length != -1)
                source = source.slice(0, length)
            source.copyTo resp.body
        } catch (Throwable e) {
            e.printStackTrace()
        } finally {
            println "Disconnected"
        }
    }
}

server.start()

println 'Ready'

