import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';

import { EMPTY, Observable } from 'rxjs';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { DropdownService } from '../shared/services/dropdown.service';
import { EstadoBr } from '../shared/models/estado-br';
import { Cidade } from '../shared/models/cidade';
import { ConsultaCepService } from '../shared/services/consulta-cep.service';
import { Cargo } from '../shared/models/cargo';
import { Tecnologia } from '../shared/models/tecnologia';
import { FormValidations } from '../shared/form-validations';
import { VerificaEmailService } from './services/verificaEmail.service';
import { BaseFormComponent } from '../shared/base-form/base-form.component';

@Component({
  selector: 'app-data-form',
  templateUrl: './data-form.component.html',
  styleUrls: ['./data-form.component.css']
})
export class DataFormComponent extends BaseFormComponent implements OnInit {

  //formulario!: FormGroup;
  estados!: EstadoBr[];
  cidades!: Cidade[];
  cargos!: Cargo[];
  tecnologias!: Tecnologia[];
  newsletters!: any[];
  frameworks: string[] = ['Angular', 'React', 'Vue', 'Sencha'];

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private dropdownService: DropdownService,
    private consultaCepService: ConsultaCepService,
    private verificaEmailService: VerificaEmailService
    ) {
      super()
    }

  ngOnInit(): void {

    //this.verificaEmailService.verificarEmail('email@email.com').subscribe();

    //this.estados = this.dropdownService.getEstadosBr();
    this.dropdownService.getEstadosBr()
      .subscribe(dados => this.estados = dados);

    this.cargos = this.dropdownService.getCargos();
    this.tecnologias = this.dropdownService.getTecnologias();
    this.newsletters = this.dropdownService.getNewsletter();

    /* this.dropdownService.getEstadosBr()
      .subscribe(dados => {
        this.estados = dados;
        console.log(dados);
      }) */

    //criando formulário instanciando novas classes
    /* this.formulario = new FormGroup({
      nome: new FormControl(null),
      email: new FormControl(null),

      endereco: new FormGroup({
        cep: new FormControl(null),
        numero: new FormControl(null),
        ...
      })
    }) */

    //criando formulário com sintaxe simplificada utilizando FormBuilder

    this.formulario = this.formBuilder.group({
      nome: [null, [Validators.required, Validators.minLength(3)]],
      email: [null, [Validators.required, Validators.email], this.validarEmail.bind(this)],
      confirmarEmail: [null, [FormValidations.equalsTo('email')]],

      endereco: this.formBuilder.group({
        cep: [null, [Validators.required, FormValidations.cepValidator]],
        numero: [null, Validators.required],
        complemento: [null],
        rua: [null, Validators.required],
        bairro: [null, Validators.required],
        cidade: [null, Validators.required],
        estado: [null, Validators.required]
      }),

      cargo: [null, Validators.required],
      tecnologias: [null],
      newsletter: ['sim'],
      aceitarTermos: [null, Validators.requiredTrue],
      frameworks: this.buildFrameworks()
    })

    this.formulario.get('endereco.cep')?.statusChanges
      .pipe(
        distinctUntilChanged(),
        tap(value => console.log('Status do CEP: ', value)),
        switchMap(status => status === 'VALID' ?
          this.consultaCepService.consultaCEP(this.formulario.get('endereco.cep')?.value)
          : EMPTY
        )
      )
      .subscribe(dados => dados ? this.populaDadosForm(dados) : {})
    ;

    this.formulario.get('endereco.estado')?.valueChanges
      .pipe(
        tap(estado => console.log('Novo estado: ', estado)),
        map(estado => this.estados.filter(e => e.sigla === estado)),
        tap(console.log),
        map((estados: any) => estados && estados.length > 0 ? estados[0].id : EMPTY),
        tap(console.log),
        switchMap((estadoId: number) => this.dropdownService.getCidades(estadoId)),
        tap(console.log)
      )
      .subscribe(cidades => this.cidades = cidades)
    ;
    //this.dropdownService.getCidades(8).subscribe(console.log);
  }

  consultaCEP() {

    let cep = this.formulario.get('endereco.cep')?.value;

    if (cep != null && cep !== '') {
      this.consultaCepService.consultaCEP(cep)
      .subscribe(dados => this.populaDadosForm(dados));
    }
  }

  populaDadosForm(dados:any){

    this.formulario.patchValue({
      endereco: {
        cep:dados.cep,
        rua: dados.logradouro,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.localidade,
        estado: dados.uf
      }
    })

    this.formulario.get('endereco.complemento')?.setValue('Casa');
  }

  resetaDadosForm(){
    this.formulario.patchValue({
      endereco: {
        rua: null,
        complemento: null,
        bairro:null,
        cidade: null,
        estado: null
      }
    });
  }

  buildFrameworks() {
    const values = this.frameworks.map(value => this.formBuilder.control(false))

    return this.formBuilder.array(values, FormValidations.requiredMinCheckbox(1))
  }

  getFrameworksConstrols() {
    return (this.formulario.get('frameworks') as FormArray).controls;
  }

  submit() {
    console.log(this.formulario)

    let valueSubmit = Object.assign({}, this.formulario.value);

    valueSubmit = Object.assign(valueSubmit, {
      frameworks: valueSubmit.frameworks
        .map((value:any, index:any) => value ? this.frameworks[index] : null)
        .filter((value: any) => value !== null)
    })

    console.log(valueSubmit)

    this.http.post('https://httpbin.org/post',
      JSON.stringify(valueSubmit))
      .subscribe(dados => {
        console.log(dados);
        //this.resetar()
      },
      (error: any) => alert('Erro'));
  }

  setarCargo() {
    const cargo = { nome: 'Dev', nivel: 'Pleno', descricao: 'Dev Pl' };
    this.formulario.get('cargo')?.setValue(cargo);
  }

  compararCargos(objeto1: Cargo, objeto2: Cargo): boolean {
    return objeto1 && objeto2 ? (objeto1.nivel === objeto2.nivel && objeto1.descricao === objeto2.descricao) : objeto1 === objeto2;
  }

  setarTecnologias() {
    this.formulario.get('tecnologias')?.setValue(['javascript', 'java', 'ruby'])
  }

  validarEmail(formControl: FormControl) {
    return this.verificaEmailService.verificarEmail(formControl.value)
      .pipe(map(emailExiste => emailExiste ? { emailInvalido : true} : null))
  }

}
