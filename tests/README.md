# Testes de regressão

Testes de lógica e autenticação simulada:

```sh
node --test tests/regressions.test.cjs
```

Para testar as permissões reais e a limpeza de dados, inicie um emulador Firestore
com o projeto **demo-lurdinha-fixes**, usando o `firestore.rules` deste repositório.
Depois execute (ajuste a porta se necessário):

```sh
FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 node --test tests/accountDeletion.rules.test.cjs
```

Esses testes só aceitam um endereço local e usam um projeto demonstrativo.
Não acessam produção. O teste da exclusão no Firebase Auth é simulado; as leituras,
escritas, transações e regras do Firestore são executadas no emulador.
A autenticação Apple real precisa ser validada em um dispositivo iOS.
