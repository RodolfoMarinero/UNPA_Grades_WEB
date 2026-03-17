import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-codigo-barras',
  standalone: true,
  template: `<svg #barcodeElement></svg>`, // Usamos SVG para máxima nitidez
  styles: [`:host { display: block; }`]
})
export class CodigoBarrasComponent implements OnChanges, AfterViewInit {
  @Input() valor: string = '';
  @ViewChild('barcodeElement') barcodeElement!: ElementRef;

  ngAfterViewInit() {
    this.generarCodigo();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['valor'] && !changes['valor'].isFirstChange()) {
      this.generarCodigo();
    }
  }

  generarCodigo() {
    if (!this.valor || !this.barcodeElement) return;

    // AQUÍ ESTÁ LA MAGIA: CONFIGURACIÓN EXACTA A ANDROID
    JsBarcode(this.barcodeElement.nativeElement, this.valor, {
      format: "CODE128",       // El estándar que usa Android
      lineColor: "#000000",
      width: 2,                // Grosor de las barras
      height: 80,              // Altura
      displayValue: true,      // Muestra el número abajo
      fontOptions: "bold",
      margin: 10
    });
  }
}
