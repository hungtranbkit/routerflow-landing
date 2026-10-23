/* RouterFlow Blueprint Engine 0.1 — planning-only, no device access or credentials. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.RouterFlowBlueprint=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='0.1.0';
  const SERVICES={
    cafe:{label:'Cafe 100 / Wi-Fi khách',low:2000000,high:5000000,
      segments:['Wi-Fi khách (cách ly thiết bị nội bộ)','POS / vận hành','Camera / IoT','Quản trị']},
    live:{label:'LiveGuard / Studio livestream',low:2000000,high:5000000,
      segments:['Studio / thiết bị phát','Vận hành / nội bộ','Khách','Quản trị']},
    device:{label:'DeviceGrid / Lab nhiều thiết bị',low:3000000,high:12000000,
      segments:['Thiết bị kiểm thử / làm việc','Máy quản lý','Khách (nếu có)','Quản trị']},
    agency:{label:'AgencyNet / Đa nhóm vận hành',low:5000000,high:15000000,
      segments:['Vận hành','Khách / BYOD','Camera / IoT','Quản trị']}
  };
  const PRESETS={
    cafe:{site:'Quán cà phê (mẫu)',scenario:'cafe',devices:100,wifiPercent:95,activePercent:55,mbpsPerActive:2,areaM2:320,floors:2,wanMain:200,wanBackup:0},
    live:{site:'Studio livestream (mẫu)',scenario:'live',devices:35,wifiPercent:35,activePercent:55,mbpsPerActive:6,areaM2:200,floors:1,wanMain:300,wanBackup:100},
    device:{site:'Device Lab (mẫu)',scenario:'device',devices:200,wifiPercent:90,activePercent:65,mbpsPerActive:1.5,areaM2:420,floors:1,wanMain:300,wanBackup:150},
    agency:{site:'Agency (mẫu)',scenario:'agency',devices:90,wifiPercent:65,activePercent:65,mbpsPerActive:2,areaM2:500,floors:2,wanMain:300,wanBackup:100}
  };
  const limits={
    devices:[1,2000,'Số thiết bị'],
    wifiPercent:[0,100,'Tỷ lệ Wi-Fi'],
    activePercent:[10,100,'Tỷ lệ đồng thời hoạt động'],
    mbpsPerActive:[0.2,50,'Nhu cầu Mbps/thiết bị đang hoạt động'],
    areaM2:[20,30000,'Diện tích'],
    floors:[1,30,'Số tầng'],
    wanMain:[1,100000,'WAN chính (Mbps)'],
    wanBackup:[0,100000,'WAN dự phòng (Mbps)']
  };
  function parse(raw){
    const errors=[],data={};
    const site=String(raw.site||'').trim();
    if(site.length>80) errors.push('Tên địa điểm tối đa 80 ký tự.');
    if(/(?:password|passwd|token|api.key|mật\s*khẩu|private.key|secret)\s*[:=]/i.test(site))
      errors.push('Không nhập thông tin đăng nhập hoặc khóa bí mật.');
    data.site=site||'Địa điểm chưa đặt tên';
    data.scenario=String(raw.scenario||'');
    if(!Object.prototype.hasOwnProperty.call(SERVICES,data.scenario)) errors.push('Chọn mô hình vận hành hợp lệ.');
    for(const [key,[min,max,label]] of Object.entries(limits)){
      const value=Number(raw[key]);
      if(raw[key]==='' || raw[key]===null || raw[key]===undefined || !Number.isFinite(value) || value<min || value>max ||
        (['devices','wifiPercent','activePercent','areaM2','floors'].includes(key)&&!Number.isInteger(value)))
        errors.push(label+' phải từ '+min+' đến '+max+'.');
      else data[key]=value;
    }
    return {ok:errors.length===0,errors,data};
  }
  const round1=n=>Math.round(n*10)/10;
  const money=n=>new Intl.NumberFormat('vi-VN').format(n)+' ₫';
  function design(raw){
    const parsed=parse(raw);
    if(!parsed.ok) return {ok:false,errors:parsed.errors};
    const d=parsed.data,s=SERVICES[d.scenario],wifi=Math.ceil(d.devices*d.wifiPercent/100),
      wired=d.devices-wifi,active=Math.ceil(d.devices*d.activePercent/100);
    const estimatedPayload=round1(active*d.mbpsPerActive);
    const planningWan=Math.ceil(estimatedPayload/0.7);
    // 20-35 concurrent clients and ~80-150 m² per AP are placeholders, NOT manufacturer promises.
    const rfMin=wifi?Math.max(d.floors,Math.ceil(wifi*d.activePercent/100/35),Math.ceil(d.areaM2/150)):0;
    const rfMax=wifi?Math.max(d.floors,Math.ceil(wifi*d.activePercent/100/20),Math.ceil(d.areaM2/80)):0;
    const ports=Math.ceil((wired+rfMax+2)*1.2);
    const switch24=ports>0&&ports<=24?1:0;
    const switch48=ports>24?Math.ceil(ports/48):0;
    const warnings=[
      'Đây là ước lượng theo giả định đầu vào, chưa khảo sát RF, bản vẽ hoặc thử tải.',
      'Số AP chỉ là khoảng lập ngân sách; phải khảo sát nhiễu, tường, bố trí thiết bị, roaming và airtime.',
      'Băng thông Mbps không phản ánh đầy đủ độ trễ, jitter, NAT sessions, CPU router hoặc uplink nội bộ.',
      'Không thể cam kết 100% uptime hoặc mỗi thiết bị có IP công cộng riêng nếu chưa xác nhận với ISP.',
      'Cần kiểm tra riêng PoE budget, số cổng uplink, khả năng switch/router và firmware.'
    ];
    if(d.wanMain<planningWan) warnings.unshift('WAN chính thấp hơn mức dung lượng hoạch định ('+planningWan+' Mbps); cần đo lưu lượng hoặc tăng gói.');
    if(d.wanBackup===0) warnings.unshift('Chưa có WAN dự phòng: một sự cố ISP có thể dừng toàn bộ dịch vụ.');
    else if(d.wanBackup<planningWan) warnings.unshift('WAN dự phòng không đủ tải tương đương WAN chính trong tình huống giả định; cần phương án giảm tải.');
    if(d.wifiPercent>=80&&d.devices>=100) warnings.push('Mật độ Wi-Fi cao: cần khảo sát kênh, 2.4/5/6 GHz, vị trí AP và kiểm thử giờ cao điểm.');
    if(d.scenario==='live') warnings.push('WAN failover có thể làm phiên livestream rớt và phải phát lại; kiểm tra RTMP/WebRTC thực tế.');
    if(d.scenario==='device') warnings.push('Quản lý trạng thái ứng dụng/Android không nằm trong chức năng giám sát mạng.');
    const bom=[
      {name:'Router/firewall có QoS & policy WAN phù hợp tải',qty:'1',note:'Chốt model sau khi kiểm tra NAT, throughput, VPN, firmware'},
      {name:'Switch quản lý 24 cổng',qty:String(switch24),note:'Chỉ nếu cần; kiểm tra PoE/uplink'},
      {name:'Switch quản lý 48 cổng',qty:String(switch48),note:'Ước lượng theo số cổng + 20% dự phòng'},
      {name:'Wi-Fi AP doanh nghiệp',qty:rfMin===rfMax?String(rfMin):rfMin+'–'+rfMax,note:'Chưa quyết định model; bắt buộc RF site survey'},
      {name:'Nguồn/UPS cho phần mạng trọng yếu',qty:'Khảo sát',note:'Chọn theo tổng công suất thiết bị'},
      {name:'Dây mạng, patch panel, phụ kiện, vật tư thi công',qty:'Khảo sát',note:'Chưa gồm trong phí dịch vụ'}
    ].filter(x=>x.qty!=='0');
    return {
      ok:true,version:VERSION,reviewRequired:true,site:d.site,scenario:d.scenario,
      name:s.label,inputs:d,summary:{
        wifiDevices:wifi,wiredDevices:wired,activeDevices:active,
        peakAggregateMbps:estimatedPayload,wanPlanningMbps:planningWan,
        wanMainMbps:d.wanMain,wanBackupMbps:d.wanBackup,
        apRange:[rfMin,rfMax],estimatedSwitchPorts:ports,switch24,switch48
      },
      segments:s.segments,
      topology:'ISP chính'+(d.wanBackup?' + ISP dự phòng':'')+' → Router/Firewall → Switch quản lý → '+(wifi?'AP/Wi-Fi, ':'')+'LAN và các VLAN riêng',
      bom,service:{low:s.low,high:s.high,currency:'VND',
        disclaimer:'Chỉ là khung phí tư vấn/triển khai thử nghiệm, không phải báo giá. Chưa gồm thiết bị, ISP, thi công và thuế.'},
      warnings,
      checkpoints:['Kiểm tra quyền quản trị và văn bản cho phép khảo sát',
        'Khảo sát mặt bằng, vật cản, nhiễu và đo RSSI/SNR/airtime',
        'Xác thực tốc độ thực, CGNAT, IP công cộng, SLA và điều kiện ISP',
        'Kiểm tra PoE, uplink, NAT sessions, CPU/router và firmware',
        'Thiết kế VLAN/ACL không để khách truy cập POS/camera/management',
        'Thử WAN down/up, thông báo lỗi, thiết bị đồng thời vào giờ cao điểm',
        'Kỹ sư ký duyệt thiết kế trước khi chốt BOM/thi công']
    };
  }
  function asText(p){
    if(!p.ok) return 'Lỗi dữ liệu: '+p.errors.join('; ');
    const s=p.summary;
    return [
      'ROUTERFLOW / PHƯƠNG ÁN SƠ BỘ v'+p.version,
      'Địa điểm: '+p.site,'Mô hình: '+p.name,
      'Trạng thái: NHÁP — CẦN KỸ SƯ DUYỆT',
      'Thiết bị: '+p.inputs.devices+' (Wi-Fi '+s.wifiDevices+', LAN '+s.wiredDevices+')',
      'Thiết bị hoạt động theo giả định: '+s.activeDevices,
      'Tải trung bình của nhóm hoạt động: '+p.inputs.mbpsPerActive+' Mbps/thiết bị',
      'Thông lượng giả định tổng: '+s.peakAggregateMbps+' Mbps; hoạch định WAN: '+s.wanPlanningMbps+' Mbps (70% mức sử dụng)',
      'WAN chính/dự phòng: '+s.wanMainMbps+'/'+s.wanBackupMbps+' Mbps',
      'Khoảng AP tham khảo: '+s.apRange.join('–')+' (không phải thiết kế RF)',
      'Cổng switch dự phòng: '+s.estimatedSwitchPorts,'',
      'SƠ ĐỒ SƠ BỘ',' '+p.topology,
      'PHÂN VÙNG',' '+p.segments.join('; '),'',
      'DANH MỤC THIẾT BỊ (CHƯA BÁO GIÁ)',
      ...p.bom.map(x=>'- '+x.name+': '+x.qty+' | '+x.note),'',
      'DỊCH VỤ THAM KHẢO: '+money(p.service.low)+' – '+money(p.service.high),
      p.service.disclaimer,'',
      'CẢNH BÁO & GIỚI HẠN',...p.warnings.map(x=>'- '+x),'',
      'CHECKLIST KHẢO SÁT/NGHIỆM THU',...p.checkpoints.map(x=>'- '+x),'',
      'Không chứa mật khẩu, token, lệnh cấu hình thiết bị hay thông tin nhạy cảm.',
      'Kỹ sư duyệt: ______________  Ngày: ______________'
    ].join('\n');
  }
  return Object.freeze({VERSION,PRESETS,SERVICES,parse,design,asText,money});
});