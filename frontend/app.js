const occurrences=[
{id:'RW-026',line:'VM02',model:'UN50M75HAGXZD',problem:'Aguardando inspeção de problema de fricção',block:2720,rework:0,time:'31h',cost:'R$ 5.440',priority:'Alta',status:'Pendente'},
{id:'RW-025',line:'VM01',model:'UN50M75HAGXZD',problem:'Problema de fricção em inspeção',block:1767,rework:420,time:'26h',cost:'R$ 3.534',priority:'Alta',status:'Em análise'},
{id:'RW-024',line:'VM04',model:'UN50M75HAGXZD',problem:'Mancha / sheet riscado',block:112,rework:74,time:'12h',cost:'R$ 896',priority:'Média',status:'Retrabalho'},
{id:'RW-023',line:'VM03',model:'UN43DU7700',problem:'Falha de processo',block:555,rework:310,time:'8h',cost:'R$ 1.110',priority:'Baixa',status:'Retrabalho'}
];
const priorityClass=p=>p==='Alta'?'high':p==='Média'?'medium':'low';
function renderRows(filter=''){
 const term=filter.toLowerCase();
 document.querySelector('#occurrenceRows').innerHTML=occurrences.filter(o=>Object.values(o).join(' ').toLowerCase().includes(term)).map(o=>`<tr><td><strong>${o.id}</strong></td><td>${o.line}<br><small>${o.model}</small></td><td class="problem">${o.problem}</td><td>${o.block.toLocaleString('pt-BR')}</td><td>${o.rework.toLocaleString('pt-BR')}</td><td>${o.time}</td><td>${o.cost}</td><td><span class="badge ${priorityClass(o.priority)}">${o.priority}</span></td><td>${o.status}</td></tr>`).join('');
}
function renderPriorities(){document.querySelector('#priorityList').innerHTML=[...occurrences].sort((a,b)=>b.block-a.block).slice(0,4).map((o,i)=>`<div class="priority"><span class="rank">#${i+1}</span><div><strong>${o.id} · ${o.line} · ${o.model}</strong><small>${o.problem} · ${o.block.toLocaleString('pt-BR')} un.</small></div><span class="badge ${priorityClass(o.priority)}">${o.priority}</span></div>`).join('')}
const modal=document.querySelector('#occurrenceModal');
document.querySelectorAll('[data-open-modal]').forEach(b=>b.addEventListener('click',()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false')}));
document.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}));
modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
document.querySelector('#search').addEventListener('input',e=>renderRows(e.target.value));
document.querySelector('#occurrenceForm').addEventListener('submit',e=>{e.preventDefault();alert('Protótipo: ocorrência validada. A integração com banco de dados será implementada na etapa de backend.');modal.classList.remove('open');e.target.reset()});
renderRows();renderPriorities();