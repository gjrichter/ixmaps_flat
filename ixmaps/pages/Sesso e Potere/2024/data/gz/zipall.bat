del *.csv.gz
COPY ..\*.csv
c:\bin\gzip *.csv 

del *.js.gz
COPY ..\*.js
c:\bin\gzip *.js 

del *.json.gz
COPY ..\*.json
c:\bin\gzip *.json 

del *.geojson.gz
COPY ..\*.geojson
c:\bin\gzip *.geojson 