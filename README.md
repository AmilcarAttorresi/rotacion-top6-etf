# Perdedor

Dashboard del backtest «comprar al mayor perdedor»: cada trimestre el capital entero rota al papel que más cayó entre el top 6 vigente de DIA, QQQ y SPY.

La ventana de la semilla va del 2 de enero de 2020 al 4 de noviembre de 2026 (6,84 años). Los gráficos y las tablas de totales salen de ese JSON. No se recalculan.

Además, 2026 se puede ver día por día: los seis papeles, el ETF y la rotación, en base 100 al cierre del 31 de diciembre de 2025, con una marca en cada fin de trimestre.

## Correr en local

Hace falta Node.js 20 o superior. En Railway el pin es Node 20: la imagen de Nixpacks para Node 22 sigue en 22.11.0, y esa versión no alcanza para Vite 8 ni React Router 8. El build usa Vite 6 y React Router 7, que corren en Node 20 y también en 22.11.

```bash
npm install
npm run dev
```

Vite sirve en [http://127.0.0.1:4327](http://127.0.0.1:4327).

## Build estático

```bash
npm run build
npm run preview
```

La salida queda en `dist/`. Las rutas son absolutas desde la raíz del dominio. Si lo colgás en un subdirectorio, cambiá `base` en `vite.config.ts`.

## Railway

El repo ya trae `railway.toml`, `nixpacks.toml` y `.nvmrc`. Railway corre `npm run build` y después `npm start`, que sirve `dist` con fallback a `index.html` (hace falta para `/canasta/dia` y el resto). Escucha en `0.0.0.0:$PORT`. No hace falta Docker ni variables secretas.

Nixpacks toma Node desde `NIXPACKS_NODE_VERSION=20` (está en `nixpacks.toml` y en `.nvmrc`). Si el servicio tiene una variable en el dashboard, dejala en `NIXPACKS_NODE_VERSION=20`. No pongas `22`: hoy esa major instala 22.11.0 y el build se cae. El install de Nixpacks es `npm install --no-package-lock`: las versiones que importan están fijas en `package.json` (Vite 6.4.5, plugin React 4.7.0, React Router 7.18.5). Node 22.22 o superior también serviría, pero Nixpacks todavía no lo entrega con `NIXPACKS_NODE_VERSION=22`.

## Cómo actualizar los totales

1. Reemplazá `src/data/backtest.json` manteniendo la misma forma.
2. No hace falta tocar los componentes: métricas, barras anuales y tablas leen ese archivo.
3. Si cambia la regla —no solo los números—, actualizá también `src/content/rules.ts`.
4. `npm run dev` recarga solo. `npm run build` tiene que pasar.

Los retornos van en decimal, no en porcentaje y no en múltiplo. `total: 2.686` es +268,6% (US$ 1 terminan en US$ 3,686). `cagr: 0.210` es 21,0%. La caída máxima va con signo negativo. `weight: 0.1028` es 10,28% del ETF.

Claves obligatorias: `window` (`start`, `end`, `years`) y `baskets.DIA`, `baskets.QQQ`, `baskets.SPY`. Cada canasta trae `label`, `holdingsAsOf`, `source`, seis `holdings` (`ticker`, `name`, `weight`), `start`, `current`, `strategy`, `ewReb`, `ewBh`, `etf` (cada una con `total`, `cagr`, `mdd`), `bestBh` (`ticker`, `total`) y `yearByYear` (`year`, `strategy`, `ewReb`, `etf`, `note` opcional). `start` tiene que ser la tenencia de mayor peso.

## Cómo actualizar la curva de 2026

Los cierres ajustados viven en `src/data/prices/`. Para bajarlos de nuevo desde Yahoo Finance:

```bash
npm run fetch-prices
```

El script pide el rango desde el 1 de junio de 2025 (hace falta el 2T 2025 para saber de qué papel se venía al cierre de 2025) hasta el último día disponible. La interfaz reconstruye la rotación en `src/lib/rotation2026.ts`: al cierre de cada trimestre entra el peor retorno del trimestre entre los seis. 2026 arranca en el peor del 4T 2025, no necesariamente en la tenencia más pesada.

Esa curva es una serie diaria. El YTD publicado en la tabla anual sigue siendo el de la semilla. Si el décimo no coincide, la tabla manda para el número cerrado y la curva manda para ver el camino.

## Qué compara la semilla

- **Rotación.** Arranque en la tenencia más grande. Cada trimestre, 100% al que más cayó entre los seis.
- **6 EW reb.** Los mismos seis, igual peso, rebalanceados al cierre de cada trimestre.
- **6 EW B&H.** Los mismos seis, igual peso, sin rebalancear.
- **ETF.** El fondo completo.
- **Mejor B&H.** El papel del top con mayor buy & hold en la ventana. Solo viene el retorno total.

## Advertencia

Hay sesgo de supervivencia. El top 6 es el vigente al 3 de noviembre de 2026 (DIA y QQQ) y al 4 de noviembre (SPY), aplicado a toda la historia. SPY es el proxy del SPX. Los precios son cierres ajustados de Yahoo Finance. Alphabet entra solo como GOOGL. Esto no es una recomendación de inversión.
