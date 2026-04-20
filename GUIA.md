# 📋 WhatsChecklist — Guia Completo para Iniciantes

Siga este passo a passo **na ordem** para ter o sistema funcionando do zero.

---

## ✅ PRÉ-REQUISITOS

Antes de começar, você precisa ter instalado no seu computador:

1. **Node.js** (versão 18 ou superior)
   - Baixe em: https://nodejs.org
   - Escolha a versão "LTS" (Long Term Support)
   - Após instalar, abra o terminal e verifique: `node -v`

2. **Um editor de código** (recomendo o VS Code)
   - Baixe em: https://code.visualstudio.com

---

## PASSO 1 — Criar conta no Supabase (banco de dados gratuito)

1. Acesse **https://supabase.com** e clique em "Start your project"
2. Crie uma conta (pode usar o Google)
3. Clique em **"New project"**
4. Preencha:
   - **Name**: `whatschecklist` (ou qualquer nome)
   - **Database Password**: crie uma senha forte e ANOTE ela
   - **Region**: escolha a mais próxima (ex: South America — São Paulo)
5. Clique em **"Create new project"** e aguarde ~2 minutos

---

## PASSO 2 — Copiar as credenciais do Supabase

1. No painel do seu projeto Supabase, clique em **"Project Settings"** (ícone de engrenagem)
2. Clique em **"API"** no menu lateral
3. Você verá:
   - **Project URL** → copie (começa com `https://`)
   - **anon / public key** → copie (começa com `eyJ`)
   - **service_role key** → copie (começa com `eyJ`) — ⚠️ **nunca compartilhe esta chave!**

---

## PASSO 3 — Configurar o CallMeBot (notificações WhatsApp gratuitas)

O CallMeBot é um serviço gratuito que envia mensagens WhatsApp via API.

1. Abra o WhatsApp no seu celular
2. Adicione o número **+34 644 64 46 26** na sua agenda (salve como "CallMeBot")
3. Envie a mensagem exatamente assim para esse número:
   ```
   I allow callmebot to send me messages
   ```
4. Aguarde a resposta. Você receberá algo como:
   ```
   API Activated for your phone number.
   Your APIKEY is 123456
   ```
5. **Anote o número da APIKEY** que você recebeu

> ⚠️ O número do ADMIN_WHATSAPP_NUMBER deve ser o número que fez esse processo.
> Formato: somente números, sem +, sem espaços. Ex: `5511999998888`

---

## PASSO 4 — Instalar as dependências do projeto

1. Abra o terminal (no Mac: `Cmd + Espaço` → digite "Terminal")
2. Navegue até a pasta do projeto:
   ```bash
   cd ~/sistema-checklist
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
   Aguarde terminar (pode demorar alguns minutos na primeira vez)

---

## PASSO 5 — Criar o arquivo de configuração (.env.local)

1. Na pasta `sistema-checklist`, copie o arquivo `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
2. Abra o arquivo `.env.local` no VS Code:
   ```bash
   code .env.local
   ```
3. Preencha com os valores que você copiou:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (sua anon key)
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (sua service role key)
   ADMIN_WHATSAPP_NUMBER=5511999998888 (seu número, só dígitos)
   CALLMEBOT_API_KEY=123456 (a chave que o CallMeBot te enviou)
   ```
4. Salve o arquivo (`Cmd+S` no Mac)

---

## PASSO 6 — Criar as tabelas no Supabase (rodar o SQL)

1. No painel do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"**
3. Abra o arquivo `supabase/schema.sql` da pasta do projeto
4. Copie TODO o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **"Run"** (botão verde) ou pressione `Cmd+Enter`
7. Você verá a mensagem "Success. No rows returned" — isso é correto!

---

## PASSO 7 — Criar o primeiro usuário Admin

O admin precisa ser criado manualmente no Supabase:

### 7.1 Criar o usuário no Supabase Auth
1. No painel do Supabase, clique em **"Authentication"**
2. Clique em **"Users"**
3. Clique em **"Add user"** → **"Create new user"**
4. Preencha:
   - **Email**: seu email de admin (ex: `admin@empresa.com`)
   - **Password**: uma senha forte
5. Clique em **"Create User"**
6. **Copie o UUID** do usuário criado (é o ID longo na coluna "UID")

### 7.2 Definir o role como "admin"
1. Vá para **"SQL Editor"** novamente
2. Cole e execute o seguinte SQL (substituindo o UUID):
   ```sql
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE user_id = 'COLE_O_UUID_AQUI';
   ```
3. Clique em **"Run"**

> 💡 A partir de agora, qualquer usuário criado pelo admin via interface
> será automaticamente um "atendente".

---

## PASSO 8 — Rodar o projeto localmente

1. No terminal, dentro da pasta `sistema-checklist`:
   ```bash
   npm run dev
   ```
2. Abra o navegador em: **http://localhost:3000**
3. Você será redirecionado para `/login`
4. Faça login com o email e senha do admin criado no Passo 7

---

## PASSO 9 — Testar o sistema

### Como admin:
1. Acesse `/admin/contas` e **adicione algumas contas** (ex: "Conta Facebook", "Conta Instagram")
2. Acesse `/admin/atendentes` e **crie um atendente** de teste
3. Saia e faça login com o atendente

### Como atendente:
1. O checklist aparece com todas as contas
2. Marque cada uma como Operável ou Restringida
3. Se Restringida, adicione uma observação (opcional)
4. Clique em **"Enviar Checklist"**
5. O admin receberá uma mensagem no WhatsApp automaticamente!

---

## PASSO 10 — Colocar no ar (Deploy na Vercel) — OPCIONAL

Para que outras pessoas possam acessar o sistema pela internet:

1. Crie uma conta em **https://vercel.com** (gratuito, pode usar o GitHub)
2. Instale a CLI da Vercel:
   ```bash
   npm install -g vercel
   ```
3. Dentro da pasta do projeto, faça o deploy:
   ```bash
   vercel
   ```
4. Siga as instruções na tela
5. Quando perguntar sobre variáveis de ambiente, adicione todas do seu `.env.local`
   - Ou vá no painel da Vercel → seu projeto → Settings → Environment Variables

> Alternativa: conecte o repositório GitHub na Vercel e o deploy é automático.

---

## ❗ SOLUÇÃO DE PROBLEMAS COMUNS

| Problema | Solução |
|---|---|
| "Invalid login credentials" | Verifique email e senha; confirme o usuário no painel Supabase |
| Não recebo WhatsApp | Verifique ADMIN_WHATSAPP_NUMBER (só números) e CALLMEBOT_API_KEY |
| "Cannot find module" | Rode `npm install` novamente |
| Página em branco | Verifique o `.env.local` — alguma variável pode estar errada |
| Erro 500 | Verifique se rodou o SQL do Passo 6 corretamente |
| Admin não consegue criar atendentes | Verifique se a SUPABASE_SERVICE_ROLE_KEY está correta no `.env.local` |

---

## 📞 RESUMO RÁPIDO

```
1. Criar conta Supabase → pegar URL + keys
2. Ativar CallMeBot no WhatsApp → pegar API key
3. npm install
4. Criar .env.local com as credenciais
5. Rodar SQL no Supabase
6. Criar usuário admin + UPDATE role='admin'
7. npm run dev → http://localhost:3000
```

Pronto! 🎉
```
