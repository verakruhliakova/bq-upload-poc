BigQuery uploader POC based on Redis buffering.

Algorithm:
1. Collect events to Redis list
2. Run job to upload events to GCS
* Rotate Redis list
* Read Redis list items to file
* Upload file to GCS
* Track file in Redis
3. Run job to upload files to BigQuery
* Rotate list of files in Redis
* Upload files to BigQuery
* Cleanup files in Redis

Start server:
```
$ npm start
```

Run load test:
```
$ loadtest http://localhost:3000/ -t 600 -d 10 --rps 1000 -p test/eventGenerator.js -m POST -T application/json
```

TODO:
* Support BigQuery partitioning
* Handle orphan jobs and failures