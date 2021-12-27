# MC_Ping

Пинг серверов minecraft с отформатированным выводом описания и прочих полей.




## Promise
```
pingWithPromise('localhost', 25565).then(console.log).catch(console.error);
```

## Async
```
ping('localhost', 25565, (error, result) => {
    if (error) {
        console.error(error);
    } else {
        console.log(result);
    }
})
```
## Установка
В npmrc записать
```
@mixer54:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=TOKEN
```

## TODO

- [x] format description in universal format
- [ ] format other fields
- [ ] create npm lib
