import {test,expect} from "@playwright/test";
for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test.describe("jornada em " + viewport.width + "px", () => {
    test.use({ viewport });
test("busca de cidade trata resposta vazia da API",async({page})=>{
 await page.route("https://geocoding-api.open-meteo.com/**",route=>route.fulfill({json:{results:[]}}));
 await page.goto("./");
 await page.getByLabel("Cidade",{exact:true}).fill("Cidade inexistente");
 await page.getByRole("button",{name:"Buscar",exact:true}).click();
 await expect(page.getByRole("alert")).toBeVisible();
});

  });
}
