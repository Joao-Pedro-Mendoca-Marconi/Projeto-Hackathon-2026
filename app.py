from flask import Flask, render_template, request, jsonify  
import random 
import string 
import requests
import google.generativeai as genai
import os
from dotenv import load_dotenv

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')



load_dotenv()
api_key = os.getenv('GCP_API_KEY')

genai.configure(api_key=api_key)

@app.route('/')
def home():
    return render_template(
        'index.html', 
        mostrar_senha='nao', 
        senha_digitada='',
        senha_gerada='',
        resultado_texto='Aguardando senha...',
        resultado_cor='#636e72'
    )

@app.route('/alerta')
def alerta():
    return render_template('anuncio.html')

@app.route('/processar-verificacao', methods=['POST'])
def processar_verificacao():
    senha = request.form.get('senha_teste', '')
    resultado_texto = "Aguardando senha..."
    resultado_cor = "#636e72"
    
    if senha:
        pontuacao = 0 
        if len(senha) >= 8: pontuacao += 1 
        if any(c.islower() for c in senha): pontuacao += 1 
        if any(c.isupper() for c in senha): pontuacao += 1 
        if any(c.isdigit() for c in senha): pontuacao += 1 
        if any(c in string.punctuation for c in senha): pontuacao += 1 

        if pontuacao <= 2:
            resultado_texto = "Força: Fraca 🔴"
            resultado_cor = "#ff7675"
        elif pontuacao <= 4:
            resultado_texto = "Força: Média 🟡"
            resultado_cor = "#fdcb6e"
        else:
            resultado_texto = "Força: Forte 🟢"
            resultado_cor = "#00b894"

    return jsonify({'resultado_texto': resultado_texto, 'resultado_cor': resultado_cor})

@app.route('/processar-geracao', methods=['POST'])
def processar_geracao():
    caracteres = string.ascii_letters + string.digits + "!@#$%^&*()_+"
    tamanho_senha = 16 
    nova_senha = "".join(random.choice(caracteres) for _ in range(tamanho_senha))
    return jsonify({'senha_generada': nova_senha})

@app.route('/processar-chat', methods=['POST'])
def processar_chat():
    pergunta_usuario = request.form.get('mensagem', '')
    
    if not pergunta_usuario:
        return jsonify({'resposta': 'Por favor, digite uma mensagem válida.'})
        
    try:
        # Usando o modelo 1.5 Flash corretamente com a requisição HTTP direta
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        payload = {
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            "Você é o Assistente Virtual formal e especialista do site Cidadania Digital. "
                            "Sua postura deve ser estritamente profissional, polida, clara e prestativa. "
                            "Responda a dúvidas sobre segurança na internet, LGPD, senhas, fake news e inteligência artificial. "
                            "Caso o usuário faça perguntas totalmente fora desse contexto, responda educadamente que seu "
                            "foco é auxiliar na segurança e cidadania digital."
                        )
                    }
                ]
            },
            "contents": [
                {
                    "parts": [
                        {"text": pergunta_usuario}
                    ]
                }
            ]
        }
        
        headers = {'Content-Type': 'application/json'}
        
        resposta_http = requests.post(url, json=payload, headers=headers)
        dados = resposta_http.json()
        
        if 'error' in dados:
            erro_msg = dados['error'].get('message', 'Erro desconhecido')
            return jsonify({'resposta': f"Erro da API do Google: {erro_msg}"})
            
        texto_resposta = dados['candidates'][0]['content']['parts'][0]['text']
        return jsonify({'resposta': texto_resposta})
        
    except Exception as e:
        print(f"Erro na requisição HTTP: {e}")
        return jsonify({'resposta': f"Erro interno de comunicação. Detalhes: {str(e)}"})

if __name__ == '__main__':
    
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)