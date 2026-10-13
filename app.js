//teste de conexão
const SUPABASE_URL = "https://pnywpshsdmzvjcxvskjr.supabase.co";
const SUPABASE_KEY = "sb_publishable_NHo0zVC0gVnboeRQfEMYIw_A7R0HSd2";

// A biblioteca supabase.js precisa ser carregada antes deste arquivo.
const _supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function testarConexao() {
    try {
        const resposta = await fetch(
            `${SUPABASE_URL}/auth/v1/health`,
            {
                headers: {
                    apikey: SUPABASE_KEY
                }
            }
        );

        const detalhes = await resposta.text();

        console.log("Status:", resposta.status);
        console.log("Resposta do Supabase:", detalhes);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        console.log("Conexão com o Supabase realizada com sucesso! 💚");
        alert("Conexão com o Supabase realizada com sucesso! 💚");

    } catch (erro) {
        console.error("Não foi possível conectar ao Supabase:", erro);
        alert("Falha na conexão. Confira o Console para ver o erro.");
    }
}

testarConexao();