// GLOBAL VARIABLES
const Sheet_ID = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const SS = SpreadsheetApp.openById(Sheet_ID);
const TABLES = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
// 24 HOURS OF DATA // ONE ROW PER MINUTE
const ROWS = 1440;
// const ROWS = 60;

// DISPLAY DATA TO UI
function doGet(e) {
  Logger.log({'GET Response':JSON.stringify(e)});
  var data = e.parameters;
  // SPECIFY HOW MANY DAYS OF DATA TO RETRIEVE
  var days = 1;
  if (data.days !== undefined){
    days = data.days;
    Logger.log(days);
  }
  // URL ROUTES TO HTML PAGES (CALLS FUNCTION)
  routes.path('Zone_1', page_zone_1(days));
  routes.path('Zone_2', getPage('Zone_2'));
  routes.path('Zone_3', page_zone_3(days));
  routes.path('Zone_4', getPage('Zone_4'));

  // CALLS ROUTES BASED ON PARAMETERS PASSED IN URL, IF NONE THEN HOME PAGE
  if (routes[e.parameters.page]) {
    return routes[e.parameters.page];
  }
  else {
    return getPage('Index');
  }
}
// RECIEVE DATA FROM LOGGERS TO SPREADSHEETS
function doPost(e) {
  Logger.log({'POST Request':JSON.stringify(e)})
  // CREATE DATE OBJECT AND PARSE TO DESIRED FORMAT
  var datetime = new Date();
  var time = check_zeros(datetime);
  var date =  (datetime.getMonth()+1) + '-' + datetime.getDate() + '-' + datetime.getFullYear();
  var data = JSON.parse(e.postData.contents);

  // CHANGE VAR DATA TO FOLLOWING FOR TESTING WITH FORM POST
  // var data = e.parameters;

  // GET SHEET FOR CORRECT TABLE
  var table_sheet = SS.getSheetByName(data['table']);
  var new_row = table_sheet.getLastRow() + 1;

  var temp1 = fix_decimals(data.temp1, 2);
  var rh1 = fix_decimals(data.rh1, 2);
  var temp2 = fix_decimals(data.temp2, 2);
  var rh2 = fix_decimals(data.rh2, 2);

  var rowData = [];
  rowData[0] = date;
  rowData[1] = time;
  rowData[2] = temp1;
  rowData[3] = rh1;
  rowData[4] = temp2;
  rowData[5] = rh2;
  
  var newRange = table_sheet.getRange(new_row, 1, 1, rowData.length);
  newRange.setNumberFormat("0.00");
  newRange.setValues([rowData]);

  return rowData;
}
