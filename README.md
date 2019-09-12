```shell script
curl --header "Authorization: $EXPRESS_AUTH" \
	-F dist=@express-hello-world.tar.gz \
	-F projectsRoot=/tmp/pr-root \
	-F pm2_process=express-hello-world \
	-X POST http://localhost:3001/upload
```