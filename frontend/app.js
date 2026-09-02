const occurrences=[
{id:'RW-026',line:'VM02',model:'UN50M75HAGXZD',problem:'Aguardando inspeção de problema de fricção',block:2720,rework:0,time:'31h',cost:'R$ 5.440',priority:'Alta',status:'Pendente'},
{id:'RW-025',line:'VM01',model:'UN50M75HAGXZD',problem:'Problema de fricção em inspeção',block:1767,rework:420,time:'26h',cost:'R$ 3.534',priority:'Alta',status:'Em análise'},
{id:'RW-024',line:'VM04',model:'UN50M75HAGXZD',problem:'Mancha / sheet riscado',block:112,rework:74,time:'12h',cost:'R$ 896',priority:'Média',status:'Retrabalho'},
{id:'RW-023',line:'VM03',model:'UN43DU7700',problem:'Falha de processo',block:555,rework:310,time:'8h',cost:'R$ 1.110',priority:'Baixa',status:'Retrabalho'}
];

const priorityClass=p=>p==='Alta'?'high':p==='Média'?'medium':'low';
const priorityIcon=p=>p==='Alta'?'▲':p==='Média'?'●':'▼';
const modal=document.querySelector('#occurrenceModal');
const form=document.querySelector('#occurrenceForm');
const statusMessage=document.querySelector('#statusMessage');
const emptyState=document.querySelector('#emptyState');
let lastFocusedElement=null;

function renderRows(filter=''){
  const term=filter.trim().toLowerCase();
  const filtered=occurrences.filter(o=>Object.values(o).join(' ').toLowerCase().includes(term));
  document.querySelector('#occurrenceRows').innerHTML=filtered.map(o=>`<tr><td><strong>${o.id}</strong></td><td>${o.line}<br><small>${o.model}</small></td><td class="problem">${o.problem}</td><td>${o.block.toLocaleString('pt-BR')}</td><td>${o.rework.toLocaleString('pt-BR')}</td><td>${o.time}</td><td>${o.cost}</td><td><span class="badge ${priorityClass(o.priority)}"><span aria-hidden="true">${priorityIcon(o.priority)}</span>${o.priority}</span></td><td><span class="badge status-badge">${o.status}</span></td></tr>`).join('');
  emptyState.hidden=filtered.length!==0;
}

function renderPriorities(){
  document.querySelector('#priorityList').innerHTML=[...occurrences].sort((a,b)=>b.block-a.block).slice(0,4).map((o,i)=>`<div class="priority"><span class="rank">#${i+1}</span><div><strong>${o.id} · ${o.line} · ${o.model}</strong><small>${o.problem} · ${o.block.toLocaleString('pt-BR')} un.</small></div><span class="badge ${priorityClass(o.priority)}"><span aria-hidden="true">${priorityIcon(o.priority)}</span>${o.priority}</span></div>`).join('');
}

function openModal(trigger){
  lastFocusedElement=trigger||document.activeElement;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  setTimeout(()=>document.querySelector('#line').focus(),0);
}

function closeModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
  clearErrors();
  if(lastFocusedElement) lastFocusedElement.focus();
}

document.querySelectorAll('[data-open-modal]').forEach(b=>b.addEventListener('click',()=>openModal(b)));
document.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',closeModal));
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&modal.classList.contains('open')) closeModal();
  if(e.key==='Tab'&&modal.classList.contains('open')){
    const focusable=[...modal.querySelectorAll('button,input,select,textarea,[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled);
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});

document.querySelector('#search').addEventListener('input',e=>renderRows(e.target.value));

const description=document.querySelector('#problemDescription');
description.addEventListener('input',()=>{document.querySelector('#charCount').textContent=`${description.value.length}/500`});

function setError(id,message){
  const input=document.querySelector(`#${id}`);
  const field=input.closest('.field');
  const error=document.querySelector(`#${id}Error`);
  field.classList.add('invalid');
  input.setAttribute('aria-invalid','true');
  input.setAttribute('aria-describedby',`${id}Error`);
  error.textContent=message;
}

function clearErrors(){
  form.querySelectorAll('.field').forEach(field=>field.classList.remove('invalid'));
  form.querySelectorAll('[aria-invalid="true"]').forEach(input=>input.removeAttribute('aria-invalid'));
  form.querySelectorAll('.field-error').forEach(error=>error.textContent='');
}

function validateForm(){
  clearErrors();
  const required=[
    ['line','Selecione a linha de produção.'],
    ['model','Informe o modelo do produto.'],
    ['problemType','Selecione o tipo de problema.'],
    ['blockedQty','Informe uma quantidade bloqueada maior que zero.'],
    ['problemDescription','Descreva o problema identificado.']
  ];
  let firstInvalid=null;
  required.forEach(([id,message])=>{
    const input=document.querySelector(`#${id}`);
    const invalid=!input.value.trim()||(id==='blockedQty'&&Number(input.value)<1);
    if(invalid){setError(id,message);if(!firstInvalid)firstInvalid=input}
  });
  if(firstInvalid){firstInvalid.focus();return false}
  return true;
}

form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!validateForm())return;
  closeModal();
  form.reset();
  document.querySelector('#charCount').textContent='0/500';
  statusMessage.textContent='Ocorrência validada no protótipo. A gravação definitiva será integrada ao backend em etapa posterior.';
  statusMessage.classList.add('visible');
  statusMessage.focus?.();
  setTimeout(()=>statusMessage.classList.remove('visible'),6500);
});

renderRows();
renderPriorities();