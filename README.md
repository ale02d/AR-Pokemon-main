# ARAndes

## Propósito del proyecto

ARAndes es un proyecto de realidad aumentada para web cuyo objetivo es crear una experiencia interactiva que permita a los usuarios explorar y comprender qué significa un barrio para los habitantes de Bogotá.

A través de elementos visuales en Realidad Aumentada, los usuarios pueden visualizar contenido digital superpuesto en el entorno real usando la cámara de su dispositivo móvil. Este contenido puede incluir:

- Elementos visuales representativos del barrio.
- Historias o narrativas asociadas al lugar.
- Contenido cultural y social.
- Información contextual sobre la identidad del barrio.

El objetivo principal es conectar la tecnología AR con la memoria urbana y la identidad cultural, permitiendo que las personas experimenten el significado de los barrios de Bogotá de una manera inmersiva.

## Tipos de Realidad Aumentada

### Marker-based AR

Utiliza marcadores o imágenes específicas para activar contenido AR.

- El sistema detecta una imagen o patrón.
- Sobre esa imagen se renderiza el objeto 3D o contenido digital.
- Ejemplo: escanear un cartel o una ilustración para activar la experiencia.

Ventajas:

- Estable.
- Fácil de implementar.
- Buen rendimiento en web.

Es el tipo de AR que utiliza MindAR.

### Markerless AR

No necesita marcadores físicos. El sistema detecta superficies, planos y espacio tridimensional.

Se utiliza con frecuencia en tecnologías como:

- ARKit.
- ARCore.

Permite colocar objetos en el suelo o en mesas.

Desventajas:

- Requiere sensores avanzados.
- Tiene compatibilidad limitada en navegadores.
- Depende de frameworks nativos o entornos más complejos.

### Location-based AR

La experiencia se activa dependiendo de la ubicación GPS del usuario.

Ejemplos:

- Juegos tipo Pokémon GO.
- Experiencias urbanas basadas en ciudad.

Ventajas:

- Ideal para recorridos urbanos.
- Permite experiencias geolocalizadas.

Desventajas:

- Precisión limitada del GPS.
- Dependencia de conectividad.

### Projection-based AR

Utiliza proyectores para mostrar contenido sobre superficies físicas.

Es poco común en web y se usa más en instalaciones físicas, museos o montajes interactivos.

## Comparación de frameworks de AR para Web

### Comparación general

| Framework | Tipo | Compatibilidad | Ventajas | Desventajas |
| --- | --- | --- | --- | --- |
| AR.js | Marker-based | Android / iOS | Muy ligero | Tecnología más antigua |
| MindAR | Marker-based | Android / iOS | Buen rendimiento y estabilidad | Solo marker-based |
| 8thWall | Marker + Markerless | Android / iOS | Muy potente | Servicio pago |
| WebXR | Markerless | Android (Chrome) | API oficial de web | Muy limitado en iOS |
| Zappar | Marker + Markerless | Android / iOS | Muy robusto | Licencias comerciales |

### Comparación técnica detallada

| Framework / Tecnología | Tipo de AR | Android (Chrome) | iOS (Safari) | ¿Requiere App? | Open Source | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| MindAR | Marker-based | Sí | Sí | No | Sí | Muy estable para AR basada en imágenes en navegador |
| AR.js | Marker-based | Sí | Parcial | No | Sí | Tecnología más antigua, rendimiento variable |
| WebXR | Markerless / XR | Sí | No | No | Sí | iOS no soporta completamente WebXR |
| 8thWall | Marker + Markerless | Sí | Sí | No | No | Muy potente pero es un servicio comercial |
| Zappar | Marker + Markerless | Sí | Sí | No | No | Plataforma robusta pero con licencias |
| ARCore | Markerless | Sí | No | Sí | No | Diseñado principalmente para apps nativas Android |
| ARKit | Markerless | No | Sí | Sí | No | Solo disponible en apps nativas iOS |

### Conclusión técnica

Para el proyecto ARAndes se decidió utilizar MindAR, ya que:

- Funciona bien en navegadores móviles.
- Tiene compatibilidad con Android e iOS.
- Es open source.
- Permite integrar fácilmente Three.js.
- No requiere instalación de apps nativas.

Esto permite que la experiencia sea accesible directamente desde el navegador web.

## Google XR y por qué no se usa

Google desarrolla varias tecnologías relacionadas con XR:

- ARCore.
- WebXR.
- Google XR SDK.

Sin embargo, muchas de estas soluciones están diseñadas principalmente para aplicaciones nativas, especialmente con motores como Unity.

### ARCore

ARCore es el sistema de realidad aumentada de Google para Android.

Está optimizado para:

- Unity.
- Android Studio.
- Aplicaciones móviles nativas.

No está pensado como solución principal para experiencias directamente en navegador web.

### WebXR

WebXR es una API estándar para experiencias XR en navegador.

Problemas actuales:

- Compatibilidad limitada en iOS.
- Safari no soporta completamente WebXR.
- Dependencia de navegadores específicos.
- Muchas funciones solo funcionan bien en Chrome Android o navegadores experimentales.
- Existe inconsistencia entre dispositivos.

Esto hace que el desarrollo de experiencias web XR sea menos confiable para proyectos accesibles al público general.

### Conclusión

Debido a estas limitaciones, Google XR no es actualmente la mejor opción para un proyecto AR web multiplataforma.

En cambio, se utilizan soluciones como MindAR, que implementan técnicas de computer vision directamente en el navegador.

## Herramientas utilizadas en el proyecto

### Three.js

Three.js es una librería de JavaScript utilizada para crear gráficos 3D en el navegador usando WebGL.

En este proyecto se utiliza para:

- Renderizado de modelos 3D.
- Manejo de escenas.
- Iluminación.
- Animaciones.
- Interacción con objetos.

### MindAR

MindAR es un framework de realidad aumentada para web que permite detectar imágenes objetivo usando la cámara del dispositivo.

Características principales:

- Marker-based AR.
- Compatible con Three.js.
- Funciona en navegadores móviles.
- No requiere aplicaciones nativas.
- Open source.

MindAR procesa el reconocimiento de imagen y posiciona los objetos 3D en la escena..

## Configuración de MindAR (`new MindARThree`)

Para iniciar una experiencia de realidad aumentada con MindAR y Three.js, se crea una instancia del motor AR utilizando la clase `MindARThree`. Esta instancia recibe un objeto de configuración que define cómo funcionará el sistema de tracking, la interfaz y el renderizado.

### Inicialización

```javascript
mindarThree = new MindARThree({
  container,
  imageTargetSrc: './Assets/Targets/targets2.mind',
  uiScanning: false,
  uiLoading: false,
  maxTrack: 1,
  filterMinCF: 0.0001,
  filterBeta: 0.01,
});
```

Este objeto de configuración controla distintos aspectos del comportamiento de la experiencia AR.

## Propiedades del objeto de configuración

### `container`

Define el elemento HTML donde se renderizará la experiencia AR.

```javascript
const container = document.querySelector('#ar-container');
```

MindAR insertará dentro de este contenedor:

- el video de la cámara del dispositivo
- el canvas de Three.js donde se renderizan los objetos 3D

Estructura aproximada generada:

```text
div#ar-container
 ├── video (stream de la cámara)
 └── canvas (render de Three.js)
```

### `imageTargetSrc`

Indica la ruta del archivo `.mind` que contiene los targets de reconocimiento de imagen.

```javascript
imageTargetSrc: './Assets/Targets/targets2.mind'
```

Este archivo no es una imagen normal. Se genera utilizando el compilador de targets de MindAR.

Flujo de generación:

```text
imagen.jpg
    ↓
MindAR Compiler
    ↓
targets.mind
    ↓
MindAR usa este archivo para detectar la imagen en cámara
```

Cuando la cámara detecta una imagen incluida en el archivo `.mind`, MindAR calcula:

- posición
- rotación
- escala relativa

y activa el anchor asociado al target.

### `uiScanning`

Controla la interfaz de escaneo por defecto de MindAR.

```javascript
uiScanning: false
```

Por defecto MindAR muestra un mensaje o guía visual indicando que el sistema está buscando un target.

Al establecer `false`:

- se desactiva la interfaz automática
- el desarrollador puede implementar su propia UI personalizada

### `uiLoading`

Controla la pantalla de carga automática de MindAR.

```javascript
uiLoading: false
```

Si está activado, MindAR muestra un mensaje de carga mientras prepara:

- la cámara
- el sistema de tracking
- los assets necesarios

Al desactivarlo, el proyecto puede manejar su propio sistema de carga o indicadores de estado.

### `maxTrack`

Define el número máximo de targets que pueden ser rastreados simultáneamente.

```javascript
maxTrack: 1
```

Ejemplo:

```text
targets disponibles:
target1
target2
target3
```

Con `maxTrack: 1` el sistema solo seguirá un target a la vez.

Si se aumenta el valor:

```javascript
maxTrack: 3
```

MindAR podrá rastrear hasta tres imágenes simultáneamente.

Hay que tener en cuenta que más targets activos implican:

- mayor uso de CPU
- mayor carga de procesamiento en el tracking

### `filterMinCF`

Controla la sensibilidad del sistema de tracking.

```javascript
filterMinCF: 0.0001
```

CF significa Confidence Factor.

Este parámetro define qué tan seguro debe estar el sistema antes de actualizar la posición del objeto AR.

Valores típicos:

```text
valores bajos  → tracking más rápido pero menos estable
valores altos  → tracking más estable pero menos reactivo
```

El valor utilizado (`0.0001`) hace que el sistema responda rápidamente a los cambios de posición del target.

### `filterBeta`

Controla el suavizado del movimiento del objeto AR.

```javascript
filterBeta: 0.01
```

Este parámetro actúa como un filtro que reduce el jitter o vibración del objeto 3D cuando el tracking detecta pequeñas variaciones en la posición del target.

Comportamiento típico:

```text
0.001 → movimiento muy suave pero con retraso
0.01  → equilibrio entre estabilidad y respuesta
0.1   → respuesta rápida pero menos suavizada
```

El valor `0.01` ofrece un equilibrio adecuado para la mayoría de experiencias AR.

## Flujo interno de inicialización

Cuando se ejecuta:

```javascript
mindarThree = new MindARThree(config);
```

MindAR prepara internamente:

1. El sistema de renderizado de Three.js.
2. La escena (`scene`).
3. La cámara (`camera`).
4. El renderer (`renderer`).
5. El motor de reconocimiento de imágenes.
6. La carga del archivo `.mind`.

Posteriormente, al ejecutar:

```javascript
await mindarThree.start();
```

ocurre el siguiente flujo:

```text
usuario concede permiso de cámara
	↓
se inicia el stream de video
	↓
MindAR analiza cada frame de la cámara
	↓
si detecta un target
	↓
calcula la posición 3D del target
	↓
activa el anchor correspondiente
	↓
Three.js renderiza los objetos asociados
```

Este proceso permite que los objetos 3D aparezcan anclados a la imagen detectada en el mundo real, creando la experiencia de realidad aumentada.

## Posibles herramientas futuras

El proyecto prioriza la experiencia de Realidad Aumentada, por lo que las tecnologías adicionales se evaluarán solo si no afectan el rendimiento de AR.

### Frameworks frontend

Si en el futuro se requiere una interfaz más compleja o una arquitectura más escalable, podrían evaluarse:

- Vue.js.
- React.

Posibles usos:

- Manejo de interfaz.
- Componentización.
- Escalabilidad del proyecto.

Sin embargo, el proyecto comienza con JavaScript puro para evitar sobrecarga innecesaria.

### Backend potencial

Si el proyecto necesita contenido dinámico, podrían integrarse tecnologías como:

- Node.js.
- Express.
- APIs REST.
- Almacenamiento de contenido cultural.

Posibles usos:

- Almacenar historias de barrios.
- Cargar contenido dinámico.
- Manejar usuarios o contribuciones.

### Otras herramientas posibles

- CMS para contenido cultural.
- Base de datos para narrativas urbanas.
- CDN para assets 3D.

## Filosofía técnica del proyecto

El desarrollo de ARAndes sigue estos principios:

### Accesibilidad

- Experiencia disponible desde navegador.
- Sin instalación de apps.

### Compatibilidad móvil

- Android.
- iOS.

### Rendimiento

- AR estable en dispositivos móviles.

### Escalabilidad

- Posibilidad de integrar backend y frameworks en el futuro.

### Prioridad en la experiencia AR

La tecnología se selecciona en función de mejorar la experiencia de realidad aumentada.

## Stack actual del proyecto

Actualmente el proyecto se construye con una base ligera orientada a rendimiento web:

- HTML para la estructura principal.
- CSS para estilos y presentación.
- JavaScript para la lógica de interacción.
- Three.js para render 3D.
- MindAR para seguimiento de imágenes y experiencia AR basada en markers.

## Enfoque del proyecto

ARAndes busca que la realidad aumentada no sea solo una capa visual, sino una herramienta para interpretar la memoria urbana, la identidad cultural y las narrativas barriales de Bogotá desde una experiencia web accesible e inmersiva.

