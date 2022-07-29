// PAGE ROUTING
var routes = {};
routes.path = function(page, func) {
  routes[page] = func;
}
function getPage(page) {
  var html = HtmlService.createTemplateFromFile(page)
  return html.evaluate();
}
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

// PAGES
function page_zone_1(days) {
  var names_list = ['A2', 'A3']
  var room_data_list = room_data_loop(names_list);
  var html = HtmlService.createTemplateFromFile('Zone_1');
  html.temp_avg = room_data_list[0];
  html.rh_avg = room_data_list[1];
  html.temp_high = room_data_list[2];
  html.temp_low = room_data_list[3];
  html.rh_high = room_data_list[4];
  html.rh_low = room_data_list[5];
  html.days = days;  
  
  return html.evaluate();
}

function page_zone_3(days) {
  var table_data = table_data_loop('C');
  var html = HtmlService.createTemplateFromFile('Zone_3');
  html.temp_avg = table_data[0];
  html.rh_avg = table_data[1];
  html.temp_high = table_data[2];
  html.temp_low = table_data[3];
  html.rh_high = table_data[4];
  html.rh_low = table_data[5]; 
  html.days = days;

  return html.evaluate();
}
