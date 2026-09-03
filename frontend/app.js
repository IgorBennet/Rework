document.addEventListener('DOMContentLoaded',()=>{
  const loginForm=document.querySelector('#login');
  if(loginForm){
    const email=document.querySelector('#email');
    const password=document.querySelector('#password');
    const emailError=document.querySelector('#emailError');
    const passwordError=document.querySelector('#passwordError');
    const status=document.querySelector('#loginStatus');
    const toggle=document.querySelector('#togglePassword');
    const demo=document.querySelector('#demoFill');

    const clearField=(input,error)=>{input.closest('.field')?.classList.remove('invalid');input.removeAttribute('aria-invalid');error.textContent=''};
    const invalidate=(input,error,message)=>{input.closest('.field')?.classList.add('invalid');input.setAttribute('aria-invalid','true');error.textContent=message};

    toggle?.addEventListener('click',()=>{
      const hidden=password.type==='password';
      password.type=hidden?'text':'password';
      toggle.textContent=hidden?'Ocultar':'Mostrar';
      toggle.setAttribute('aria-pressed',String(hidden));
      password.focus();
    });

    demo?.addEventListener('click',()=>{
      email.value='qualidade@rework.demo';
      password.value='1234';
      clearField(email,emailError);clearField(password,passwordError);
      status.className='status-message success';
      status.textContent='Acesso demonstrativo preenchido. Clique em “Entrar no Rework”.';
      password.focus();
    });

    loginForm.addEventListener('submit',e=>{
      e.preventDefault();
      clearField(email,emailError);clearField(password,passwordError);
      status.className='status-message';status.textContent='';
      let valid=true;
      if(!email.value.trim()||!email.validity.valid){invalidate(email,emailError,'Informe um e-mail válido.');valid=false}
      if(password.value.length<4){invalidate(password,passwordError,'Informe uma senha com pelo menos 4 caracteres.');valid=false}
      if(!valid){status.className='status-message error';status.textContent='Revise os campos destacados antes de continuar.';loginForm.querySelector('[aria-invalid="true"]')?.focus();return}
      status.className='status-message success';
      status.textContent='Acesso validado. Abrindo o dashboard demonstrativo…';
      setTimeout(()=>{window.location.href='dashboard.html'},450);
    });
    return;
  }

  document.querySelectorAll('[data-logout]').forEach(btn=>btn.addEventListener('click',()=>{window.location.href='index.html'}));
});