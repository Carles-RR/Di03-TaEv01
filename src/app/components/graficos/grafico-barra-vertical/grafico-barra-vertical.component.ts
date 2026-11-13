// *****************************************************************************
// IMPORTS
// *****************************************************************************
import { Component, input, effect, viewChild, ElementRef, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Chart } from 'chart.js';
import { Restaurante } from '../../../interface/restaurante';
import { CHART_PALETTE } from '../utils/chart-colors';
import '../utils/chart-setup';

@Component({
  selector: 'app-grafico-barra-vertical',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './grafico-barra-vertical.component.html',
  styleUrls: ['./grafico-barra-vertical.component.scss']
})
export class GraficoBarraVerticalComponent implements OnDestroy {

  restaurantes = input<Restaurante[]>([]);

  private canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  private chart?: Chart;

  constructor() {
    effect(() => {
      const data = this.restaurantes();
      const c = this.canvas();
      if (!c) return;

      this.render(data, c.nativeElement);
    });
  }

  // *************************************************************************
  // GRÁFICO — Barras verticales: restaurantes por territorio
  //
  // TIPO: 'bar' (barras verticales por defecto)
  //
  // PREPARACIÓN DE DATOS:
  //   Usamos un Map<territorio, conteo> para agrupar y contar en una sola
  //   pasada por el array. Después convertimos el Map en un array de pares
  //   [territorio, cantidad] y lo ordenamos de mayor a menor.
  //
  // COLORES:
  //   El sufijo 'bb' en hex es el canal alpha (bb hex = ~73% opacidad),
  //   lo que da el efecto de relleno semitransparente con borde sólido.
  // *************************************************************************
  private render(data: Restaurante[], canvas: HTMLCanvasElement) {
    // TODO: elimina la gráfica anterior antes de volver a pintar cuando
    // el efecto reciba datos nuevos.
    this.chart?.destroy();
    // TODO: 'counts' debe guardar una entrada por territorio. Usa el
    // territorio como clave y reserva un número para acumular restaurantes mediante Map.
    const counts = new Map<string, number>();
    data.forEach(r => {
      // TODO: extrae de cada restaurante el territorio que quieres dibujar -> campo territory
      // como categoría. Decide cómo tratar los valores vacíos o inexistentes.
      const territorio = r.territory?.trim() || 'Desconocido';
      // TODO: recupera el contador de ese territorio, suma el restaurante
      // actual y guarda de nuevo el resultado asociado a la misma clave.
      counts.set(territorio, (counts.get(territorio) ?? 0) + 1); 
   });

    // TODO: convierte los grupos en una lista ordenable. Cada entrada
    // conserva el nombre del territorio y el número que debe medir la barra.
    // Elige un criterio de orden que facilite la comparación visual ((a, b) => b[1] - a[1]).
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    // TODO: crea la gráfica en el canvas y construye la configuración de
    // Chart.js haciendo corresponder cada etiqueta con su valor numérico.
    
    this.chart = new Chart(canvas, {
    type: 'bar',
    data: {
      // TODO: las etiquetas forman las categorías del eje horizontal.
      labels: sorted.map(([territorio]) => territorio),
      datasets: [{
        label: 'Restaurantes',
        // TODO: los valores deben estar en el mismo orden que las
        // etiquetas: el primer valor corresponde a la primera categoría.
        data: sorted.map(([, cantidad]) => cantidad),
        backgroundColor: sorted.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length] + 'bb'), //CHART_PALETTE[i % CHART_PALETTE.length] + 'bb')
        borderColor: sorted.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]), //CHART_PALETTE[i % CHART_PALETTE.length]
        borderWidth: 2,
        // borderRadius: redondea las esquinas superiores de cada barra
        borderRadius: 8,
        // borderSkipped: false → redondea TODAS las esquinas, no solo la superior
        borderSkipped: false,
      }]
    },
    options: {
      // TODO: revisa qué ajustes hacen que el eje numérico comience en
      // cero y que las divisiones representen cantidades enteras.
      // responsive: true → la gráfica se redimensiona al cambiar el contenedor
      responsive: true,
      // maintainAspectRatio: false → permite controlar la altura desde CSS
      maintainAspectRatio: false,
      plugins: {
        // Ocultamos la leyenda porque el título y el eje X ya identifican los datos
        legend: { display: false },
        title: {
          display: true,
          text: 'Restaurante por territorio',
          font: { size: 15, weight: 'bold' },
          color: '#ccb3b3',
          padding: { bottom: 14 }
        },
        tooltip: {
          callbacks: {
            // Sobreescribimos el texto del tooltip para personalizar el mensaje
            label: ctx => ` ${ctx.parsed.y} restaurantes`
          }
        }
      },
        scales: {
          //TODO: controlar los ticks, beginAtZero, grid... en los x e y si es necesario.
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: '#ccb3b3',
              stepSize: 25
            },
            grid: { color: 'rgba(243, 236, 236, 0.2)' }
            
          },
          x: {
            grid: {display: false},
            ticks: {color: '#ccb3b3',}
          }
        }
      }
    });
  }

  // *************************************************************************
  // ngOnDestroy — imprescindible destruir la instancia de Chart para liberar
  // el canvas, eliminar los event listeners internos y evitar memory leaks.
  // *************************************************************************
  ngOnDestroy() {
    this.chart?.destroy();
  }
}
