#!/usr/bin/env python3
"""
Autorização única do Google Calendar para o Instituto Intus.

O que faz: abre uma janela do navegador pedindo para você fazer login
com socialartlanguage@gmail.com e clicar em "Permitir". Depois disso,
salva um arquivo de token em secrets/google-token.json — esse arquivo é
o que o site vai usar para criar eventos e links do Meet automaticamente,
sem precisar fazer login de novo.

Rode uma vez só (ou de novo, se o token expirar/for revogado):
    secrets/venv/bin/python3 scripts/google_authorize.py

Precisa existir antes: secrets/intus-google-credentials.json
(baixado do Google Cloud Console, Credenciais → ID do cliente OAuth).
"""
import json
import os
from google_auth_oauthlib.flow import InstalledAppFlow

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREDENTIALS_PATH = os.path.join(BASE, "secrets", "intus-google-credentials.json")
TOKEN_PATH = os.path.join(BASE, "secrets", "google-token.json")

# Escopo mínimo necessário: criar e gerenciar eventos (não mexe em
# configurações da agenda, não lê outras agendas).
SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def main():
    if not os.path.exists(CREDENTIALS_PATH):
        raise SystemExit(
            f"Não encontrei {CREDENTIALS_PATH}.\n"
            "Baixe o JSON de credenciais do Google Cloud Console e salve nesse caminho."
        )

    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
    print("\nAbra o link abaixo no navegador (logado com socialartlanguage@gmail.com)")
    print("e clique em 'Permitir'. Esta janela vai aguardar sua confirmação.\n")
    creds = flow.run_local_server(port=0, open_browser=False, prompt="consent")

    with open(TOKEN_PATH, "w") as f:
        f.write(creds.to_json())

    print(f"\nPronto! Token salvo em: {TOKEN_PATH}")
    print("Esse arquivo nunca deve ser compartilhado nem subido ao GitHub.")


if __name__ == "__main__":
    main()
