/*
$.getJSON("@@@PREFIX@@@/json/json1.json",function(data1){
  $.getJSON("@@@PREFIX@@@/json/json2.json",function(data2){
    render(data1,data2);
  });
});
function render(data1,data2) {
  console.log(data1);
  console.log(data2);
}
*/

var ep = EventProxy.create("json1", "json2", function (json1, json2) {
  console.log(json1);
  console.log(json2);
});

$.get("@@@PREFIX@@@/json/json1.json", function (data) {
  // something
  ep.emit("json1", data);
});
$.get("@@@PREFIX@@@/json/json2.json", function (data) {
  // something
  ep.emit("json2", data);
});

var eproxy = new EventProxy();
eproxy.immediate('funcName',function(){
  console.log(1);
},'aa')



