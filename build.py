import json,re
P=json.load(open('products_raw.json'));A=json.load(open('assets.json'));M=json.load(open('media.json'))
def b64(k,mime):return M[k]
prods=[]
for i,p in enumerate(P):
    prods.append({'id':'p%d'%(i+1),'group':p['group'],'cat':p['category'],'name':p['name'],'desc':p['description'],'price':p['price'],'badge':p['badge'],'photos':[p['img']]})
prods.append({'id':'p%d'%(len(P)+1),'group':'longrich','cat':'Suppléments','name':'Libao','desc':'Capsules Libao Longrich. Demandez-nous les conseils d’utilisation sur WhatsApp.','price':480000,'badge':'Nouveau','photos':[b64('libao','image/jpeg')]})
cat={'rev':1,'pass':None,'zones':[{'name':n,'fee':0} for n in ['Kaloum','Dixinn','Matam','Ratoma','Matoto']],'products':prods}
media={'logo':A['logo'],'welcome':b64('welcome','image/jpeg'),'hero0':A['hero'][0],'hero1':A['hero'][1],'cat0':A['cat'][0],'cat1':A['cat'][1],'banner':A['banner']}
def j(o):return json.dumps(o,ensure_ascii=False).replace('<','\\u003c')
t=open('template.html',encoding='utf-8').read()
rep={'__STYLE__':open('style.css',encoding='utf-8').read(),'__APPJS__':open('app.js',encoding='utf-8').read(),'__MEDIA__':j(media),'__CATALOG__':j(cat),
 '__ICON32__':b64('icon32','image/png'),'__ICON180__':b64('icon180','image/png')}
for k,v in rep.items():
    assert k in t,k
    t=t.replace(k,v) if k not in('__APPJS__','__STYLE__','__MEDIA__','__CATALOG__') else t.replace(k,'\0'+k)
for k in('__STYLE__','__APPJS__','__MEDIA__','__CATALOG__'):
    t=t.replace('\0'+k,rep[k])
open('index.html','w',encoding='utf-8').write(t)
print(len(t)//1024,'KB')
