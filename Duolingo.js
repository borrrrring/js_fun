/*
 *脚本功能：duolingo
 *脚本整理：Peng-Lx
 **********************
 *QX
 [rewrite_local]
 ^https:\/\/duolingo-leaderboards-prod.duolingo.cn\/leaderboards* url script-response-body https://raw.githubusercontent.com/Peng-Lx/lxpscript/master/JS/duolinggo.js
 **********************
 *hostname = duolingo-leaderboards-prod.duolingo.cn
 **********************
 
 *Surge&loon
 [Script]
 http-response ^https:\/\/photos\.adobe\.io\/v2\/accounts* requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/Peng-Lx/lxpscript/master/JS/duolinggo.js
 */
 
  
var body = $response.body;
var url = $request.url;
var obj = JSON.parse(body);
obj['num_sessions_remaining_to_unlock'] = 0;
obj['tier'] = 4;
if(!obj['active'])
{
 obj['active'] = {};
}
obj['active']['collab_goal_accepted'] = false;
obj['active']['complete'] = false;
if(!obj['active']['contest']){
 obj['active']['contest'] = {}
}
obj['active']['contest']['contest_end'] = '2099-11-04T00:00:00Z'
obj['active']['contest']['contest_start'] = '2019-10-28T00:00:00Z'
obj['active']['contest']['contest_state'] = 'ACTIVE'
obj['active']['contest']['registration_end'] = '2099-11-03T00:00:00Z'
obj['active']['contest']['registration_state'] = 'OPEN'
body = JSON.stringify(obj);
$done({body});
//Bylangkhach
