import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonMeterComponent } from './ion-meter/ion-meter.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [IonMeterComponent],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [IonMeterComponent]
})
export class ComponentsModule { }