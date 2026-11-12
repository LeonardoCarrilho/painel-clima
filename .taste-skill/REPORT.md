GATE: OPEN 35 (rounds used up)

# Revisão final da interface

Refs #6; continuação do PR #4. Sem merge ou publicação.

A composição preserva a ferramenta operacional, os campos e os resultados reais. O [plano](PLAN.md) registra a identidade, o deal e suas adaptações. A UI não recebeu fotografias, mockups, estatísticas ou depoimentos inventados. Não há fatos assumidos nem marca nova.

## Evidências

- Antes: [desktop](../docs/redesign-before.png), 1440×2268; baseline do main anterior à integração.
- Depois: [desktop](../docs/preview.png), 1440×2642; [mobile](../docs/preview-mobile.png), 390×3544.
- Capturas finais inspecionadas visualmente. Não há baseline mobile, gate anterior ao redesign ou medição comparável de performance; não inferimos melhoria numérica. Altura total é dimensão da captura, não nota de qualidade. Câmbio e clima usam dados externos, que podem variar entre capturas.
- 51 testes unitários/cobertura passaram na integração. CI com E2E em 320, 390, 768, 820, 1024 e 1440px passou no commit bda894c: [execução](https://github.com/LeonardoCarrilho/painel-clima/actions/runs/43126688395). Os checks incluem CSP e fluxo existente.
- npm audit: zero vulnerabilidades após overrides restritos de test-exclude; não houve mudança nas regras de negócio. Build e lint passaram. Os dois últimos ajustes são CSS de foco; o gate final exercitou Tab.

## Gate e limites

O [registro integral](findings.json) contém 36 achados FAIL antes das isenções: 1 receberam isenções específicas e 35 permanecem efetivamente abertos, conforme a linha GATE acima. Também registra 23 WARNs e suas localizações. O campo histórico openFails do JSON inclui os achados isentados; a contagem efetiva é a da linha GATE. A validação não é PASS. As exigências de seções fullscreen, CTA promocional por seção, fotografia/mockup e momentos de demonstração são incompatíveis com a manutenção destas ferramentas. Elas continuam abertas, sem isenções genéricas. Alinhamentos sinalizados em painéis, subtítulos e tabelas foram confrontados com as capturas. Rolagem horizontal interna do clima é intencional e acessível por teclado, sem overflow de página nos testes de CI.

Achados finais de foco, contraste, toque, colisão, overflow de página e entrada: nenhum FAIL dessas classes no gate final.

Os WARNs de copy permanecem no registro: rótulos curtos de ações existentes e títulos informativos em português não foram convertidos em copy de venda. Não foram executados novos perfis de performance. Estados de erro, vazio, armazenamento e ações têm testes, mas não possuem captura anterior comparável.

## Isenções específicas

- **nav**, div#root > header.site-header > div.wrap.header-inner > a.brand "Painel Clima previsão sem excesso": This is a single brand link with a name and a category subtitle, not navigation wrapping. Both lines are visible within the header in the final desktop screenshot.

A camada motion foi mantida sem editar o kit. Os momentos sorteados não foram aplicados a números financeiros ou meteorológicos. As três rodadas e os resultados exatos permanecem no registro; nenhuma contagem de gate foi usada como comparação com o baseline.
