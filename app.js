//teste de conexão
const SUPABASE_URL = "https://pnywpshsdmzvjcxvskjr.supabase.co";
const SUPABASE_KEY = "sb_publishable_NHo0zVC0gVnboeRQfEMYIw_A7R0HSd2";

// A biblioteca supabase.js precisa ser carregada antes deste arquivo.
const _supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


async function testarConexao() {
    const { error } = await _supabase
        .from("Agendamento")
        .select("Id_Agendamento")
        .limit(1);

    if (error) {
        console.error("Erro ao acessar o banco:", error);
        alert("Não foi possível acessar a tabela de agendamentos.");
        return false;
    }

    console.log("Banco de agendamentos acessível! 💚");
    return true;
}


// Carrega os serviços no campo de seleção

async function carregarServicos() {
    const campoServico = document.getElementById("servico");
    const campoModalidade = document.getElementById("modalidade");

    const { data, error } = await _supabase
        .from("Servico")
        .select("Id_Servico, Nome_Servico, Preco_Servico")
        .order("Nome_Servico");

    if (error) {
        console.error("Erro ao carregar serviços:", error);
        campoServico.innerHTML =
            '<option value="">Erro ao carregar serviços</option>';
        return;
    }

    console.log("Serviços encontrados:", data);

    // Guarda os serviços encontrados para usar nas duas seleções
    window.listaServicos = data;

    // Cria a lista sem repetir os nomes dos serviços
    const nomesServicos = [...new Set(
        data.map(function (servico) {
            return servico.Nome_Servico
                .replace(/\s*-\s*Manutencao$/i, "")
                .replace(/\s*-\s*Manutenção$/i, "");
        })
    )];

    campoServico.innerHTML =
        '<option value="">Selecione um serviço</option>';

    nomesServicos.sort().forEach(function (nome) {
        const opcao = document.createElement("option");
        opcao.value = nome;
        opcao.textContent = nome;
        campoServico.appendChild(opcao);
    });

    campoModalidade.innerHTML =
        '<option value="">Selecione primeiro um serviço</option>';
    campoModalidade.disabled = true;
}


function carregarModalidades() {
    const campoServico = document.getElementById("servico");
    const campoModalidade = document.getElementById("modalidade");
    const campoPreco = document.getElementById("precoServico");

    const nomeSelecionado = campoServico.value;

    campoModalidade.innerHTML =
        '<option value="">Selecione uma modalidade</option>';
    campoModalidade.disabled = true;
    campoPreco.textContent = "";

    if (!nomeSelecionado) {
        return;
    }

    const servicos = window.listaServicos.filter(function (servico) {
        const nomeBase = servico.Nome_Servico
            .replace(/\s*-\s*Manutencao$/i, "")
            .replace(/\s*-\s*Manutenção$/i, "");

        return nomeBase === nomeSelecionado;
    });

    servicos.forEach(function (servico) {
        const ehManutencao =
            /-\s*Manuten(c|ç)(a|ã)o$/i.test(servico.Nome_Servico);

        const opcao = document.createElement("option");
        opcao.value = servico.Id_Servico;
        opcao.textContent = ehManutencao
            ? "Manutenção"
            : "Aplicação";

        opcao.dataset.preco = servico.Preco_Servico;
        campoModalidade.appendChild(opcao);
    });

    campoModalidade.disabled = false;
}


// Procura uma cliente ou cadastra se ela ainda não existir
async function buscarOuCriarCliente(nome) {
    const nomeFormatado = nome.trim().replace(/\s+/g, " ");
    const { data: clientes, error: erroBusca } = await _supabase
        .from("Cliente")
        .select("Id_Cliente, Nome_Cliente")
        .ilike("Nome_Cliente", nomeFormatado);

    if (erroBusca) {
        throw erroBusca;
    }

    //temporario
    console.log("Nome procurado:", nomeFormatado);
    console.log("Clientes encontrados:", clientes);

    if (clientes.length > 0) {
        return clientes[0].Id_Cliente;
    }

    const { data: novaCliente, error: erroCadastro } = await _supabase
        .from("Cliente")
        .insert([{ Nome_Cliente: nomeFormatado }])
        .select("Id_Cliente")
        .single();

    if (erroCadastro) {
        throw erroCadastro;
    }

    return novaCliente.Id_Cliente;
}


// Salva o agendamento
async function salvarAgendamento() {
    const nome = document.getElementById("nomeCliente").value.trim();
    const data = document.getElementById("data").value;
    const hora = document.getElementById("hora").value;
    const idServico = document.getElementById("modalidade").value;
    const botao = document.getElementById("salvarAgendamento");

    if (!nome || !data || !hora || !idServico) {
        alert("Preencha todos os campos antes de salvar.");
        return;
    }

    botao.disabled = true;
    botao.textContent = "Salvando...";

    try {
        const { data: { session } } = await _supabase.auth.getSession();

        console.log(
            "Sessão atual:",
            session ? session.user.email : "SEM SESSÃO"
        );

        // Verifica se já existe um agendamento nesse dia e horário
        const { data: horariosOcupados, error: erroBusca } = await _supabase
            .from("Agendamento")
            .select("Id_Agendamento")
            .eq("Data", data)
            .eq("Horario", hora);

        if (erroBusca) {
            throw erroBusca;
        }

        console.log("Data procurada:", data);
        console.log("Horário procurado:", hora);
        console.log("Agendamentos encontrados:", horariosOcupados);

        if (horariosOcupados.length > 0) {
            alert("Esse horário já está ocupado! Escolha outro, por favor.");
            return;
        }
        const idCliente = await buscarOuCriarCliente(nome);

        const { error } = await _supabase
            .from("Agendamento")
            .insert([{
                Data: data,
                Horario: hora,
                Id_Cliente: idCliente,
                Id_Servico: Number(idServico)
            }]);

        if (error) {
            throw error;
        }
        alert("Agendamento salvo com sucesso! 💚");

        document.getElementById("nomeCliente").value = "";
        document.getElementById("data").value = "";
        document.getElementById("hora").value = "";
        document.getElementById("servico").value = "";
        document.getElementById("modalidade").value = "";
        document.getElementById("precoServico").textContent = "";

    } catch (erro) {
        console.error("Erro ao salvar agendamento:", erro);
        console.error("Mensagem:", erro.message);
        console.error("Código:", erro.code);
        console.error("Detalhes:", erro.details);
        console.error("Dica:", erro.hint);

        alert("Não foi possível salvar. Confira o Console.");
    } finally {
        botao.disabled = false;
        botao.textContent = "Salvar";
    }
}




// Inicializa as telas
document.addEventListener("DOMContentLoaded", async function () {

    // LOGIN
    const formLogin = document.getElementById("formLogin");

    if (formLogin) {
        formLogin.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value;
            const mensagem = document.getElementById("mensagemLogin");
            const botaoLogin = formLogin.querySelector('button[type="submit"]');

            botaoLogin.disabled = true;
            mensagem.textContent = "Verificando acesso...";

            try {
                const { error } = await _supabase.auth.signInWithPassword({
                    email: email,
                    password: senha
                });

                if (error) {
                    throw error;
                }

                window.location.href = "menu.html";

            } catch (erro) {
                console.error("Erro no login:", erro);

                mensagem.textContent =
                    "Não foi possível entrar. Confira seu e-mail e sua senha.";

            } finally {
                botaoLogin.disabled = false;
            }
        });
    }

    // AGENDAMENTO
    const botao = document.getElementById("salvarAgendamento");
    const campoServico = document.getElementById("servico");
    const campoModalidade = document.getElementById("modalidade");

    // Se não for a página de agendamento, encerra apenas esta parte
    if (!botao || !campoServico || !campoModalidade) {
        return;
    }

    console.log("Formulário de agendamento encontrado!");

    botao.addEventListener("click", salvarAgendamento);
    campoServico.addEventListener("change", carregarModalidades);

    campoModalidade.addEventListener("change", function () {
        const opcao = campoModalidade.selectedOptions[0];
        const campoPreco = document.getElementById("precoServico");

        if (opcao && opcao.value) {
            campoPreco.textContent =
                "Preço: R$ " +
                Number(opcao.dataset.preco).toFixed(2).replace(".", ",");
        } else {
            campoPreco.textContent = "";
        }
    });

    try {
        await testarConexao();
        await carregarServicos();
    } catch (erro) {
        console.error("Erro ao iniciar a página:", erro);
        alert("Ocorreu um erro ao carregar o formulário. Veja o Console.");
    }
});



