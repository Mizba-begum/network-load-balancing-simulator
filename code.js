let servers=[
 {name:"Server 1",weight:3,status:"alive",active:0,total:0},
 {name:"Server 2",weight:2,status:"alive",active:0,total:0},
 {name:"Server 3",weight:1,status:"alive",active:0,total:0}
];

let pos=0,requests=0,completed=0,times=[];

const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const variance=a=>avg(a.map(x=>(x-avg(a))**2));
const alive=()=>servers.filter(s=>s.status=="alive");

document.getElementById("algorithm").onchange=()=>pos=0;

function selectServer(type,list){
 if(type=="round")return list[pos++%list.length];
 if(type=="least")return list.reduce((a,b)=>b.active<a.active?b:a);
 if(type=="weighted"){
  let a=[];
  list.forEach(s=>{for(let i=0;i<s.weight;i++)a.push(s)});
  return a[pos++%a.length];
 }
 return list[Math.floor(Math.random()*list.length)];
}

function sendRequest(){
 let list=alive();
 if(!list.length)return addActivity("Request failed - no server available.");
 let s=selectServer(document.getElementById("algorithm").value,list);
 let id=++requests,start=Date.now();
 s.active++;s.total++;
 addActivity("Request "+id+" sent to "+s.name);
 showServers();showMetrics();

 setTimeout(()=>{
  s.active--;completed++;
  let t=Date.now()-start;
  times.push(t);
  addActivity("Request "+id+" completed by "+s.name+" in "+t+" ms");
  showServers();showMetrics();
 },(1000+Math.random()*2000)/s.weight);
}

function failServer(i){
 servers[i].status="dead";
 addActivity(servers[i].name+" has failed.");
 showServers();
}

function recoverServer(i){
 if(servers[i].status!="dead")return;
 servers[i].status="recovering";
 showServers();
 setTimeout(()=>{
  servers[i].status="alive";
  addActivity(servers[i].name+" has recovered.");
  showServers();
 },2000);
}

function simulate(type,batch){
 let sim=alive().map(s=>({
  weight:s.weight,active:0,free:0,ends:[],count:0
 }));
 let result=[];pos=0;

 batch.forEach(r=>{
  sim.forEach(s=>s.active=s.ends.filter(x=>x>r.at).length);
  let s=selectServer(type,sim);
  let start=Math.max(r.at,s.free);
  s.free=start+r.work/s.weight;
  s.ends.push(s.free);s.count++;
  result.push(s.free-r.at);
 });

 return {
  avg:avg(result),
  fair:variance(sim.map(s=>s.count/s.weight))
 };
}

function comparisonMode(){
 if(!alive().length)return alert("No alive server!");

 let batch=[];
 for(let i=0;i<60;i++)
  batch.push({at:i*250,work:500+Math.random()*1500});

 let names={
  round:"Round Robin",
  least:"Least Connections",
  weighted:"Weighted Round Robin",
  random:"Random"
 };

 let results=[];

 for(let key in names){
  let r=simulate(key,batch);
  results.push({name:names[key],avg:r.avg,fair:r.fair});
 }

 let fastest=Math.min(...results.map(r=>r.avg));
 let best=results.filter(r=>r.avg<=fastest*1.05)
                 .reduce((a,b)=>b.fair<a.fair?b:a);
 let slowest=Math.max(...results.map(r=>r.avg));

 let html="<table><tr><th>Algorithm</th><th>Avg Response Time</th><th>Chart</th><th>Fairness</th></tr>";

 results.forEach(r=>{
  html+=`<tr class="${r==best?"best":""}">
  <td>${r.name}</td>
  <td>${r.avg.toFixed(0)} ms</td>
  <td><div class="bar"><div style="width:${r.avg/slowest*100}%"></div></div></td>
  <td>${r.fair.toFixed(2)}</td></tr>`;
 });

 html+="</table>";
 html+=`<p><b>Best Performing Algorithm: ${best.name}</b></p>
 <p>Average response time: ${best.avg.toFixed(0)} ms.
 Load variance: ${best.fair.toFixed(2)}.</p>`;

 document.getElementById("comparison").innerHTML=html;
}

function showServers(){
 document.getElementById("servers").innerHTML=servers.map((s,i)=>`
 <div class="server">
 <h3>${s.name}</h3>
 <p class="${s.status}">${s.status}</p>
 <p>Active: ${s.active}</p>
 <div class="bar"><div style="width:${Math.min(s.active*20,100)}%"></div></div>
 <p>Speed: ${s.weight}x</p>
 <p>Total: ${s.total}</p>
 <button onclick="failServer(${i})">Fail</button>
 <button onclick="recoverServer(${i})">Recover</button>
 </div>`).join("");
}

function showMetrics(){
 document.getElementById("metrics").innerHTML=`<div class="cards">
 <div><b>${requests}</b>Total Requests</div>
 <div><b>${completed}</b>Completed</div>
 <div><b>${requests-completed}</b>In Progress</div>
 <div><b>${times.length?avg(times).toFixed(0):0} ms</b>Avg Response</div>
 </div>`;
}

function addActivity(msg){
 let a=document.getElementById("activity");
 a.innerHTML="<p>"+msg+"</p>"+a.innerHTML;
}

showServers();
showMetrics();
