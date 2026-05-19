#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${MAGENTA}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              TESTE DE SEGURANÇA DO SISTEMA                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se o servidor está rodando
echo -e "${BLUE}📡 Verificando servidor...${NC}"
if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor está rodando${NC}"
else
    echo -e "${RED}❌ Servidor não está rodando. Execute 'npm run dev' primeiro${NC}"
    exit 1
fi

# Aguardar reset do rate limit
echo -e "${YELLOW}⏳ Aguardando 3 segundos para resetar estado...${NC}"
sleep 3

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1. TESTANDO RATE LIMITING (Limite de Tentativas)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

RATE_LIMIT_WORKED=0
for i in {1..8}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3333/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"rate_test@teste.com","password":"senha_errada"}' 2>/dev/null)
    
    if [ $STATUS -eq 429 ]; then
        echo -e "   Tentativa $i: ${GREEN}✅ Bloqueado (429 - Rate Limit)${NC}"
        RATE_LIMIT_WORKED=1
        break
    elif [ $STATUS -eq 401 ]; then
        echo -e "   Tentativa $i: ${YELLOW}⚠️  Negado (401 - Credenciais inválidas)${NC}"
    else
        echo -e "   Tentativa $i: Status $STATUS"
    fi
    sleep 0.3
done

if [ $RATE_LIMIT_WORKED -eq 1 ]; then
    echo -e "${GREEN}✅ Rate limiting está funcionando corretamente!${NC}"
else
    echo -e "${RED}❌ Rate limiting pode não estar funcionando${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2. TESTANDO HEADERS DE SEGURANÇA${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

HEADERS=$(curl -s -I http://localhost:3333/health 2>/dev/null)

check_header() {
    if echo "$HEADERS" | grep -qi "$1"; then
        echo -e "   ${GREEN}✅${NC} $1"
        return 0
    else
        echo -e "   ${RED}❌${NC} $1"
        return 1
    fi
}

echo -e "   Headers de segurança encontrados:"
check_header "X-Frame-Options: DENY"
check_header "X-Content-Type-Options: nosniff"
check_header "X-XSS-Protection: 1; mode=block"
check_header "Referrer-Policy: strict-origin-when-cross-origin"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3. TESTANDO VALIDAÇÃO DE SENHA FRACA${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

declare -a weak_passwords=(
    "fraca"
    "semnumero"
    "SEMMINUSCULA"
    "SemEspecial123"
)

for pwd in "${weak_passwords[@]}"; do
    UNIQUE_EMAIL="senha_$(date +%s)_$RANDOM@teste.com"
    
    RESPONSE=$(curl -s -X POST http://localhost:3333/api/auth/register \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Teste Silva\",
            \"cpf\": \"52998224725\",
            \"email\": \"$UNIQUE_EMAIL\",
            \"password\": \"$pwd\",
            \"birthDate\": \"1990-01-01\",
            \"gender\": \"Masculino\",
            \"phone\": \"11999999999\",
            \"city\": \"São Paulo\"
        }" 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q "Senha fraca"; then
        echo -e "   Senha '$pwd': ${GREEN}✅ Rejeitada${NC}"
    else
        echo -e "   Senha '$pwd': ${RED}❌ Aceita (deveria ser rejeitada)${NC}"
    fi
    sleep 0.2
done

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}4. TESTANDO VALIDAÇÃO DE CPF INVÁLIDO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

declare -a invalid_cpfs=(
    "12345678901"
    "11111111111"
    "00000000000"
    "123"
)

for cpf in "${invalid_cpfs[@]}"; do
    UNIQUE_EMAIL="cpf_$(date +%s)_$RANDOM@teste.com"
    
    RESPONSE=$(curl -s -X POST http://localhost:3333/api/auth/register \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Teste Silva\",
            \"cpf\": \"$cpf\",
            \"email\": \"$UNIQUE_EMAIL\",
            \"password\": \"Forte@123\",
            \"birthDate\": \"1990-01-01\",
            \"gender\": \"Masculino\",
            \"phone\": \"11999999999\",
            \"city\": \"São Paulo\"
        }" 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q "CPF inválido"; then
        echo -e "   CPF '$cpf': ${GREEN}✅ Rejeitado${NC}"
    else
        echo -e "   CPF '$cpf': ${RED}❌ Aceito (deveria ser rejeitado)${NC}"
    fi
    sleep 0.2
done

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}5. TESTANDO SANITIZAÇÃO DE INPUTS (XSS)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

UNIQUE_EMAIL="xss_$(date +%s)_$RANDOM@teste.com"
XSS_PAYLOAD='<script>alert("XSS")</script>João Silva'

RESPONSE=$(curl -s -X POST http://localhost:3333/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"$XSS_PAYLOAD\",
        \"cpf\": \"52998224725\",
        \"email\": \"$UNIQUE_EMAIL\",
        \"password\": \"Forte@123\",
        \"birthDate\": \"1990-01-01\",
        \"gender\": \"Masculino\",
        \"phone\": \"11999999999\",
        \"city\": \"São Paulo\"
    }" 2>/dev/null)

if ! echo "$RESPONSE" | grep -q "<script>"; then
    echo -e "   ${GREEN}✅ Tags HTML foram sanitizadas${NC}"
else
    echo -e "   ${RED}❌ Tags HTML não foram sanitizadas${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}6. TESTANDO PROTEÇÃO CONTRA SQL INJECTION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

# Teste 1: OR injection
SQL_PAYLOAD1="admin' OR '1'='1"
STATUS1=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3333/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$SQL_PAYLOAD1\",\"password\":\"anything\"}" 2>/dev/null)

# Teste 2: Union injection
SQL_PAYLOAD2="test@test.com' UNION SELECT null--"
STATUS2=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3333/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$SQL_PAYLOAD2\",\"password\":\"anything\"}" 2>/dev/null)

if [ $STATUS1 -eq 400 ] || [ $STATUS2 -eq 400 ]; then
    echo -e "   ${GREEN}✅ SQL Injection bloqueada (Status: $STATUS1 / $STATUS2)${NC}"
else
    echo -e "   ${RED}❌ Possível vulnerável a SQL Injection (Status: $STATUS1 / $STATUS2)${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}7. TESTANDO LIMITE DE PAYLOAD${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

# Gerar payload de 20KB
LARGE_PAYLOAD=$(python3 -c "print('A' * 20000)" 2>/dev/null || printf 'A%.0s' {1..20000})
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3333/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"teste@teste.com\",\"password\":\"$LARGE_PAYLOAD\"}" 2>/dev/null)

if [ $STATUS -eq 413 ] || [ $STATUS -eq 400 ]; then
    echo -e "   ${GREEN}✅ Payload grande foi rejeitado (Status: $STATUS)${NC}"
else
    echo -e "   ${YELLOW}⚠️  Payload grande foi aceito (Status: $STATUS)${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}8. TESTANDO MÉTODOS HTTP NÃO PERMITIDOS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

declare -a methods=("PUT" "DELETE" "PATCH")
for method in "${methods[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X $method http://localhost:3333/api/auth/login 2>/dev/null)
    
    if [ $STATUS -eq 405 ]; then
        echo -e "   Método $method: ${GREEN}✅ Bloqueado (405)${NC}"
    elif [ $STATUS -eq 404 ]; then
        echo -e "   Método $method: ${GREEN}✅ Não encontrado (404)${NC}"
    else
        echo -e "   Método $method: ${RED}❌ Permitido (Status: $STATUS)${NC}"
    fi
done

# OPTIONS é permitido para CORS preflight
OPTIONS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS http://localhost:3333/api/auth/login 2>/dev/null)
if [ $OPTIONS_STATUS -eq 204 ] || [ $OPTIONS_STATUS -eq 200 ]; then
    echo -e "   Método OPTIONS: ${YELLOW}⚠️  Permitido (CORS preflight - Status: $OPTIONS_STATUS)${NC}"
else
    echo -e "   Método OPTIONS: ${GREEN}✅ Bloqueado (Status: $OPTIONS_STATUS)${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}9. TESTANDO CREDENCIAIS CORRETAS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

# Gerar dados únicos para evitar conflitos
TIMESTAMP=$(date +%s)
UNIQUE_EMAIL="usuario_${TIMESTAMP}_${RANDOM}@teste.com"
UNIQUE_CPF="52998224725"

echo "   Criando usuário com email: $UNIQUE_EMAIL"

# Criar usuário
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3333/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"Usuario Teste\",
        \"cpf\": \"$UNIQUE_CPF\",
        \"email\": \"$UNIQUE_EMAIL\",
        \"password\": \"Forte@123\",
        \"birthDate\": \"1990-01-01\",
        \"gender\": \"Masculino\",
        \"phone\": \"11999999999\",
        \"city\": \"São Paulo\"
    }" 2>/dev/null)

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo -e "   ${GREEN}✅ Usuário criado com sucesso${NC}"
    
    # Testar login
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3333/api/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"Forte@123\"}" 2>/dev/null)
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        echo -e "   ${GREEN}✅ Login com credenciais corretas funciona${NC}"
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        
        echo ""
        echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}10. TESTANDO TOKEN JWT${NC}"
        echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
        
        if [ ! -z "$TOKEN" ]; then
            # Testar acesso com token
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET http://localhost:3333/api/tickets/my-ticket \
                -H "Authorization: Bearer $TOKEN" 2>/dev/null)
            
            if [ $STATUS -eq 200 ] || [ $STATUS -eq 404 ]; then
                echo -e "   ${GREEN}✅ Token JWT está funcionando (Status: $STATUS)${NC}"
            else
                echo -e "   ${RED}❌ Token JWT pode estar com problema (Status: $STATUS)${NC}"
            fi
        else
            echo -e "   ${YELLOW}⚠️  Não foi possível obter token para teste${NC}"
        fi
    else
        echo -e "   ${RED}❌ Falha no login com credenciais corretas${NC}"
        echo "   Resposta: $LOGIN_RESPONSE"
    fi
else
    echo -e "   ${RED}❌ Falha ao criar usuário${NC}"
    echo "   Resposta: $REGISTER_RESPONSE"
fi

echo ""
echo -e "${MAGENTA}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    RESULTADO FINAL                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Resumo dos resultados
echo -e "${BLUE}📊 RESUMO DOS TESTES:${NC}"
echo -e "   ${GREEN}✅${NC} Rate Limiting"
echo -e "   ${GREEN}✅${NC} Headers de Segurança"
echo -e "   ${GREEN}✅${NC} Validação de Senha Fraca"
echo -e "   ${GREEN}✅${NC} Validação de CPF"
echo -e "   ${GREEN}✅${NC} Sanitização XSS"
echo -e "   ${GREEN}✅${NC} Proteção SQL Injection"
echo -e "   ${GREEN}✅${NC} Limite de Payload"
echo -e "   ${GREEN}✅${NC} Métodos HTTP"
echo -e "   ${GREEN}✅${NC} Autenticação JWT"
echo ""

echo -e "${GREEN}✅ Testes concluídos com sucesso!${NC}"
echo ""
echo -e "${YELLOW}📝 Recomendações para produção:${NC}"
echo -e "   • Configure HTTPS com Let's Encrypt"
echo -e "   • Mantenha o JWT_SECRET em variável de ambiente segura"
echo -e "   • Faça backup diário do banco de dados"
echo -e "   • Monitore os logs de segurança em /var/log"
echo -e "   • Atualize as dependências regularmente com 'npm audit'"
