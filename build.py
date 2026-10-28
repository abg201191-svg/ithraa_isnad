css = open("sem.css").read() + open("pal.css").read() + open("comp.css").read()
js = open("data.js").read() + "\n" + open("app1.js").read() + "\n" + open("core2.js").read() + "\n" + open("app2.js").read() + "\n" + open("views.js").read() + "\n" + open("app3.js").read()
open("all.js","w").write(js)
old = open("index.html").read()
a = old.index("<style>\n")+8
b = old.index("\n</style>")
c = old.index("<script>\n")+9
d = old.rindex("\n</script>")
new = old[:a] + css + old[b:c] + js + old[d:]
open("index.html","w").write(new)
print(len(new))
