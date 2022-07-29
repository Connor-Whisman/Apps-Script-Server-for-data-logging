// REPLACE DECIMAL FUNCTION FOR LONG FLOATS
function fix_decimals(float, dec_places) {
  var zeros = '';
  var str_float = String(float);
  // CHECK IF DECIMAL EXISTS IN GIVEN FLOAT
  if (str_float.indexOf(".") > 0) {
    // IF SO, SEE IF ITS THE SAME AS WHAT WE WANT
    var array = str_float.split('.');
    var decimal = String(array[1]);
    // IF IT'S LESS, ADD AMOUNT OF ZEROS NEEDED TO THE END 
    if (decimal.length < dec_places) {
      var difference = dec_places - decimal.length;
      for (var i = 0; i < difference; i++) {
        zeros += '0';
      }
      var fixed = decimal + zeros;
    }
    // IF ITS MORE, REDUCE TO AMOUNT WE WANT
    else if (decimal.length > dec_places) {
      var fixed = decimal.slice(0, dec_places);
    }
    // IF IT'S THE SAME, LEAVE IT BE
    else {
      var fixed = decimal;
    }
    return array[0] + '.' + fixed;
  }
  // DECIMAL DOESN'T EXIST, ADD AMOUNT OF ZEROS WANTED
  else {
    for (var i = 0; i < dec_places; i++) {
      zeros += '0'
    }
    return str_float + '.' + zeros;
  }
}

// ADD 0 TO SINGLE DIGIT TIMES
function check_zeros(datetime) {
  var hour = datetime.getHours();
  var min = datetime.getMinutes();
  if (String(min).length <2) {
    min = '0' + min;
  }
  if (String(hour).length <2) {
    hour = '0' + hour;
  }
  return hour + ':' + min;
}

// CONVERT CELSIUS TO FAHRENHEIT
function to_fahr(celsius) {
  return celsius * 1.8 + 32;
}

// LOOPS THROUGH SHEET/TABLE AND RETURNS A LIST OF TABLE DATA [TEMP_AVG, RH_AVG, TEMP_HIGH, TEMP_LOW, RH_HIGH, RH_LOW]
function table_data_loop(sheet_name) {
  var num_rows = ROWS;
  var temp_avg = 0;
  var rh_avg = 0;
  var temps = [];
  var rhs = [];
  var all_temps = [];
  var all_rhs = [];
  
  var sheet = SS.getSheetByName(sheet_name);
  var last_row = sheet.getLastRow();

  // Logger.log('current sheet: ' + String(sheet.getName()))

  if (last_row < num_rows) {
    num_rows = last_row;}
  var first_row = last_row - num_rows + 1;
  var data = sheet.getRange(first_row, 1, num_rows, 6).getValues();

  // GET ROW AVERAGES
  for (var key in data) {
    if (key == 0) {
      continue;}
    var value = data[key];

    // TEMP AND HUMIDITY VALUES TO LIST FOR 24 AVG ANALYSIS
    temps.push((value[2] + value[4]) / 2);
    rhs.push((value[3] + value[5]) / 2);
    // FOR FINDING HIGHS AND LOWS
    all_temps.push(value[2], value[4]);
    all_rhs.push(value[3], value[5]);
  }
  // GET 24 HOUR AVERAGE FOR SHEET/TABLE
  for (var i in temps) {
    temp_avg = temp_avg + Number(temps[i]);}
  temp_avg = temp_avg / temps.length;
  for (var j in rhs) {
    rh_avg = rh_avg + Number(rhs[j]);}
  rh_avg = rh_avg / rhs.length;

  // GET HIGHS AND LOWS
  var temp_high = Math.max(...all_temps);
  var temp_low = Math.min(...all_temps);
  var rh_high = Math.max(...all_rhs);
  var rh_low = Math.min(...all_rhs);

  var data = [temp_avg, rh_avg, temp_high, temp_low, rh_high, rh_low];
  return data;
}

// LOOPS THROUGH ALL SHEETS AND RETURNS A LIST OF ROOM DATA [TEMP_24_AVG, RH_24_AVG, TEMP_HIGH, TEMP_LOW, RH_HIGH, RH_LOW]
function room_data_loop(sheets_list) {
  var temps = [];
  var rhs = [];
  var temp_highs = [];
  var temp_lows = [];
  var rh_highs = [];
  var rh_lows = [];
  
  for (var key in sheets_list) {
    // var sheet = sheets_list[key];
    // var name = sheet.getName();
    var name = sheets_list[key];
    if (name == 'Index') {
      continue;}
    var loop = table_data_loop(name);
    temps.push(loop[0]);
    rhs.push(loop[1]);
    
    temp_highs.push(loop[2]);
    temp_lows.push(loop[3]);
    rh_highs.push(loop[4]);
    rh_lows.push(loop[5]);
  }
  var temp_room_24hour = 0;
  var rh_room_24hour = 0;

  for (var i in temps){
    temp_room_24hour += Number(temps[i]);}
  temp_room_24hour = fix_decimals(temp_room_24hour / temps.length, 1);
  for (var i in rhs){
    rh_room_24hour += Number(rhs[i]);}
  rh_room_24hour = fix_decimals(rh_room_24hour / rhs.length, 1);
  
  var temp_high = fix_decimals(Math.max(...temp_highs), 1);
  var temp_low = fix_decimals(Math.min(...temp_lows), 1);
  var rh_high = fix_decimals(Math.max(...rh_highs), 1);
  var rh_low = fix_decimals(Math.min(...rh_lows), 1);

  return [temp_room_24hour, rh_room_24hour, temp_high, temp_low, rh_high, rh_low];
}

// LOOPS THROUGH ALL SHEETS AND GETS LAST ROW DATA AVERAGES (MOST RECENT). RETURNS LISTS IN DICT {'TABLE NAME':[REC_TEMP, REC_RH]}
function table_data_currents(sheets_list) {
  var dict = {};
  for (var key in sheets_list) {
    var name = sheets_list[key];
    var sheet = SS.getSheetByName(name);
    var last_row = sheet.getLastRow();
    var data = sheet.getRange(last_row, 3, 1, 4).getValues();
    
    for (var x in data) {
      var value = data[x];
      var temp_avg = fix_decimals((Number(value[0]) + Number(value[2])) / 2, 1);
      var rh_avg = fix_decimals((Number(value[1]) + Number(value[3])) / 2, 1);
      dict[sheets_list[key]] = [temp_avg, rh_avg];
    }    
  }
  return dict;
}

// FOR EACH ROW IN SPECIFIED AMOUNT OF RECENT DATA (USUALLY 1440 ROWS), LOOP THROUGH EVERY SHEET CONTAINING DATA AND CALCULATE VARIOUS DATA POINTS.
// RETURN A DICT WITH ALL DATA POINTS {'time':time_x, 'temps':temps_y, 'rhs':rhs_y, 'temp_cur':temp_cur, 'rh_cur':rh_cur}
// CURRENTLY RETURN [time_x, temps_y, rhs_y, t_start]
function build_graphs_v1() {
  var start_time = new Date().getTime();
  var Sheets = SS.getSheets();
  var time_x = [];
  var temps_y = [];
  var rhs_y = [];
  var t = -ROWS / 60;
  var incr = t / ROWS;
  var temp_cur = 0;
  var rh_cur = 0;
  
  // FOR EVERY ROW, LOOP THROUGH EVERY SHEET.. AND CREATE TIME (X) VALUES
  for (var i = 0; i < ROWS; i++) {
    // Logger.log({'i':i});
    var row_temps = [];
    var row_rhs = [];
    var temp_avg = 0;
    var rh_avg = 0;

    var time = t - i * incr;

    time_x.push(fix_decimals(time, 2));
    
    // FOR EVERY SHEET, LOOP THROUGH ENTIRE ROW (STARTING FROM END TO BEGINNING)..
    for (var y in Sheets) {
      var sheet = Sheets[y];
      var current_row = sheet.getLastRow() - i;
      // Logger.log({'Current Row':current_row});
      // IF WE REACH THE END OF THE SHEET (BEGINNING), GO TO NEXT SHEET
      if (current_row <= 1) {
        continue; }
      var data = sheet.getRange(current_row, 3, 1, 4).getValues();
      for (var cell in data) {
        var value = data[cell];
        row_temps.push(value[0], value[2]);
        row_rhs.push(value[1], value[3]);
      }
    }
    // Logger.log({'Row Temps':row_temps});
    for (var j = 0; j < row_temps.length; j++) {
      temp_avg += row_temps[j];
    }
    // Logger.log({'Row RHs':row_rhs});
    for (var x = 0; x < row_rhs.length; x++) {
      rh_avg += row_rhs[x];
    }
    
    temp_avg = fix_decimals(temp_avg / row_temps.length, 1);
    rh_avg = fix_decimals(rh_avg / row_rhs.length, 1);
    temps_y.push(temp_avg);
    rhs_y.push(rh_avg);
    // IF ITS THE MOST RECENT ROW, SAVE VALUES FOR UI
    if (i == 0) {
      temp_cur = temp_avg;
      rh_cur = rh_avg;
      t_start = t;
    }
    // Logger.log({'Row Temp avg':temp_avg});
    // Logger.log({'Row RH avg':rh_avg});
  }
  var end_time = new Date().getTime();
  var time_elapsed_sec = (end_time - start_time) * 0.001;
  var estimate = (24 / (ROWS / 60)) * time_elapsed_sec;
  Logger.log({'iterations':i, 'time elapsed':String(time_elapsed_sec) + ' seconds'});
  Logger.log({'Estimated time for 24 hours of data:':String(estimate / 60) + ' minutes'});

  // Logger.log({'temps':temps_y, 'rhs':rhs_y});
  // Logger.log({'time':time_x});
  // html.time_x = time_x;
  // html.temps_y = temps_y;
  // html.rhs_y = rhs_y;
  // html.temp_cur = temp_cur;
  // html.rh_cur = rh_cur;
  // html.t = t_start;
  // return {'time':time_x, 'temps':temps_y, 'rhs':rhs_y, 'temp_cur':temp_cur, 'rh_cur':rh_cur, 't':t_start};
  return [time_x, temps_y, rhs_y, t_start];
  // return html.evaluate();
}

// BUILDS FROM FURTHEST AWAY TO MOST RECENT. NEEDS TO BE REVERSED IN ORDER TO INCLUDE SHEETS LESS THAN A DAY OLD
function build_graphs(tables, days) {
  Logger.log(days);
  var start_time = new Date().getTime();
  var num_rows = ROWS * days;
  var t = -num_rows / 60;
  var incr = t / num_rows;
  var sheets_data = [];
  var time_x = [];
  var temps_y = [];
  var rhs_y = [];
  var temp_cur = 0;
  var rh_cur = 0;

  // GET ALL ROWS FOR EACH TABLE AND THEN LOOP THROUGH ACCUIRED DATA
  for (var i in tables) {
    var name = tables[i];
    var sheet = SS.getSheetByName(name);
    var last_row = sheet.getLastRow();
    
    // FOR NOW, SKIP PAGE IF NUMBER OF ROWS IS LESS THAN DESIRED OUTPUT
    if (last_row < num_rows) {
      continue; }
    var first_row = last_row - num_rows + 1;
    var data_list = [];
    var data = sheet.getRange(first_row, 3, num_rows, 4).getValues();
    for(var j in data) {
      var values = data[j];
      data_list.push(values);
    }
    sheets_data.push(data_list);
    // Logger.log(data_list);
  }
  // LOOP THROUGH BIG LIST AND COMPARE DATA FROM SHEETS
  for (var i = 0; i < sheets_data[0].length; i++) {
    var row_temps = [];
    var row_rhs = [];
    var temp_avg = 0;
    var rh_avg = 0;

    var time = t - i * incr;
    time_x.push(fix_decimals(time, 2));
    if (i == 0) {
      t_start = t;
    }
    for (var x in sheets_data) {
      var sheet = sheets_data[x];
      var row = sheet[i];
      row_temps.push((row[0] + row[2]) / 2);
      row_rhs.push((row[1] + row[3]) / 2);
    }
    for (var j = 0; j < row_temps.length; j++) {
      temp_avg += row_temps[j];
    }
    temp_avg = fix_decimals(to_fahr(temp_avg / row_temps.length), 1);
    temps_y.push(temp_avg);

    for (var y = 0; y < row_rhs.length; y++) {
      rh_avg += row_rhs[y];
    }
    rh_avg = fix_decimals(rh_avg / row_rhs.length, 1);
    rhs_y.push(rh_avg);

    // IF WERE ON THE LAST ROW
    if (i == sheets_data[0].length - 1) {
      temp_cur = temp_avg;
      rh_cur = rh_avg;
    }
  }
  var end_time = new Date().getTime();
  var time_elapsed_sec = (end_time - start_time) * 0.001;
  Logger.log(time_elapsed_sec + ' seconds');
  // return {'time':time_x, 'temps':temps_y, 'rhs':rhs_y, 'temp_cur':temp_cur, 'rh_cur':rh_cur};
  return [time_x, temps_y, rhs_y, t_start];
}

// RETURN [time_x, temps_y, rhs_y, t_start]
function zone_3_graphs(days) {
  Logger.log(days);
  var time_x = [];
  var temps_y = [];
  var rhs_y = [];
  var temp_cur = 0;
  var rh_cur = 0;
  
  var Sheet = SS.getSheetByName('C');
  var last_row = Sheet.getLastRow();
  var num_rows = ROWS * days;
  if (last_row < ROWS) {
    num_rows = last_row; }
  var t = -num_rows / 60;
  var incr = t / num_rows;
  var t_start = 0;
  var first_row = last_row - num_rows + 1;
  var data = Sheet.getRange(first_row, 3, num_rows, 4).getValues();

  for(var i in data) {
    var values = data[i];
    temps_y.push(fix_decimals(to_fahr((values[0] + values[2]) / 2), 1));
    rhs_y.push(fix_decimals((values[1] + values[3]) / 2, 1));
  }
  for (var j = 0; j < data.length; j++) {
    time_x.push(fix_decimals(t - j * incr, 2));
    if (j == 0) {
      t_start = t;
    }
  }
  return [time_x, temps_y, rhs_y, t_start];
}
