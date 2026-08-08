async function api(path, options={}){const response=await fetch(path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Request failed');return data}
async function loadSettings(guildId){return api(`/api/servers/${encodeURIComponent(guildId)}/settings`)}
async function saveProtection(guildId, values){return api(`/api/servers/${encodeURIComponent(guildId)}/protection`,{method:'POST',body:JSON.stringify(values)})}
async function saveLogs(guildId, channelId, enabled=true){return api(`/api/servers/${encodeURIComponent(guildId)}/logs`,{method:'POST',body:JSON.stringify({channelId,enabled})})}
async function createBackup(guildId,name){return api(`/api/servers/${encodeURIComponent(guildId)}/backups`,{method:'POST',body:JSON.stringify({name})})}
window.AnoDashboard={api,loadSettings,saveProtection,saveLogs,createBackup};
