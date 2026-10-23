(() => {
  const nav = document.getElementById('primaryNav');
  const toggle = document.getElementById('menuToggle');
  const purpose = document.getElementById('purpose');
  const form = document.getElementById('briefForm');
  const result = document.getElementById('briefResult');
  document.getElementById('year').textContent=String(new Date().getFullYear());
  toggle.addEventListener('click',()=>{
    const expanded=toggle.getAttribute('aria-expanded')!=='true';
    toggle.setAttribute('aria-expanded',String(expanded));
    nav.classList.toggle('is-open',expanded);
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded','false');
  }));
  document.querySelectorAll('[data-preset]').forEach(a=>a.addEventListener('click',()=>{
    const name=a.dataset.preset;
    purpose.value=[...purpose.options].some(o=>o.value===name)?name:'Khác';
  }));
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const f=new FormData(form); const n=Number(f.get('devices'));
    result.hidden=false;
    if(!Number.isInteger(n)||n<1||n>10000){result.textContent='Số thiết bị phải từ 1 đến 10.000.';return}
    const brief=[
      'ROUTERFLOW / YÊU CẦU KHẢO SÁT MẠNG',
      'Ngày: '+new Date().toLocaleDateString('vi-VN'),
      'Mô hình: '+f.get('purpose'),
      'Thiết bị đồng thời: '+n,
      'WAN: '+f.get('wans'),
      'Hạ tầng hiện có: '+(f.get('equipment')||'Chưa cung cấp'),
      'Sự cố/mục tiêu: '+f.get('issues'),
      '',
      'CẦN XÁC MINH: mặt bằng, tỷ lệ LAN/Wi-Fi, yêu cầu tải, ISP/CGNAT, thiết bị/firmware, VLAN, bảo mật, ngân sách, SLA.',
      'Không cung cấp mật khẩu, token hoặc file cấu hình có chứa secrets.',
      'Đây là brief cục bộ; không phải báo giá hay cấu hình đã kiểm định.'
    ].join('\n');
    let copied=false;
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(brief);copied=true}}catch{}
    result.replaceChildren();
    const title=document.createElement('strong');
    title.textContent=copied?'✓ Đã sao chép brief.':'Brief được tạo; sao chép nội dung bên dưới.';
    const pre=document.createElement('pre');pre.textContent=brief;
    const btn=document.createElement('button');btn.type='button';btn.className='btn btn-outline';btn.textContent='Sao chép lại';
    btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(brief);btn.textContent='✓ Đã sao chép'}catch{pre.tabIndex=0;pre.focus();btn.textContent='Hãy chọn và sao chép nội dung';}});
    result.append(title,pre,btn);
  });
})();