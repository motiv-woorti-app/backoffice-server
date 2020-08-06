/*
(C) 2017-2020 - The Woorti app is a research (non-commercial) application that was
developed in the context of the European research project MoTiV (motivproject.eu). The
code was developed by partner INESC-ID with contributions in graphics design by partner
TIS. The Woorti app development was one of the outcomes of a Work Package of the MoTiV
project.
 
The Woorti app was originally intended as a tool to support data collection regarding
mobility patterns from city and country-wide campaigns and provide the data and user
management to campaign managers.
 
The Woorti app development followed an agile approach taking into account ongoing
feedback of partners and testing users while continuing under development. This has
been carried out as an iterative process deploying new app versions. Along the 
timeline,various previously unforeseen requirements were identified, some requirements
Were revised, there were requests for modifications, extensions, or new aspects in
functionality or interaction as found useful or interesting to campaign managers and
other project partners. Most stemmed naturally from the very usage and ongoing testing
of the Woorti app. Hence, code and data structures were successively revised in a
way not only to accommodate this but, also importantly, to maintain compatibility with
the functionality, data and data structures of previous versions of the app, as new
version roll-out was never done from scratch.

The code developed for the Woorti app is made available as open source, namely to
contribute to further research in the area of the MoTiV project, and the app also makes
use of open source components as detailed in the Woorti app license. 
 
This project has received funding from the European Union’s Horizon 2020 research and
innovation programme under grant agreement No. 770145.
 
This file is part of the Woorti app referred to as SOFTWARE.
*/
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Reward, CampaignService } from 'src/app/providers/campaign.service';
import { SurveyConnectionsService } from 'src/app/providers/survey-connections.service';
import { Location } from '@angular/common';
import * as moment from 'moment';

@Component({
  selector: 'app-edit-reward',
  templateUrl: './edit-reward.component.html',
  styleUrls: ['./edit-reward.component.css']
})
export class EditRewardComponent implements OnInit {

  rewardToEdit: Reward; // can be null
  rewardForm: FormGroup;

  endDateMin: moment.Moment;

  availableCampaigns;

  constructor(
    private route: ActivatedRoute,
    private campaignService: CampaignService,
    private surveyService: SurveyConnectionsService,
    private location: Location
  ) { }

  ngOnInit() {
    this.endDateMin = moment().add(2,'days');
    this.campaignService.getCampaignsByRolePrivileges().then(campaigns => {
      this.availableCampaigns = campaigns;
    });

    this.route.queryParams.subscribe(params => {
      var rewardId: string = params["rewardId"];
      this.campaignService.getRewardById(rewardId).then(reward => {
        this.rewardToEdit = reward;
        this.initializeRewardFormFromExistingReward();
      });
    });
  }

  /**
   * Initialize reward form from existing reward
   */
  initializeRewardFormFromExistingReward() {

    let startDateDateIso = moment(this.rewardToEdit.startDate).toISOString();
    let endDateDateIso = moment(this.rewardToEdit.endDate).toISOString();

    this.rewardForm = new FormGroup({
      rewardName : new FormControl(this.rewardToEdit.rewardName, [Validators.required]),
      targetCampaignId : new FormControl({value: this.rewardToEdit.targetCampaignId, disabled: true}, [Validators.required]),
      
      startDate : new FormControl({value: startDateDateIso, disabled: true}, [Validators.required]),  
      endDate : new FormControl({value: endDateDateIso, disabled: false}, [Validators.required]),
      target : new FormGroup({
        type : new FormControl({value: this.rewardToEdit.targetType, disabled: true}, [Validators.required]),
        value : new FormControl({value: this.rewardToEdit.targetValue, disabled: true}, [Validators.required, Validators.min(1)])
      }),
      organizerName : new FormControl(this.rewardToEdit.organizerName, [Validators.required]),
      linkToContact : new FormControl(this.rewardToEdit.linkToContact),
  
      descriptions : new FormArray([], [this.alreadyUsedLanguageValidator])
    });

    let defLang = this.rewardToEdit.defaultLanguage;
    let defLangShortDescr = this.rewardToEdit.descriptions[defLang].shortDescription;
    let defLangLongDescr = this.rewardToEdit.descriptions[defLang].longDescription;
    this.addNewDescription(defLang, defLangShortDescr, defLangLongDescr); // add description for default language, which is mandatory
    
    let allLangs = Object.keys(this.rewardToEdit.descriptions);
    allLangs.forEach(lang => {
      if (lang !== defLang){  // def lang was already defined as 1 element
        let shortDescr = this.rewardToEdit.descriptions[lang].shortDescription;
        let longDescr = this.rewardToEdit.descriptions[lang].longDescription;
        this.addNewDescription(lang, shortDescr, longDescr);
      }
    });
  }

  /**
   * Add new description
   * 
   * @param langVal 
   * @param shoerDescrVal 
   * @param longDescrVal 
   */
  addNewDescription(langVal: string = "", shoerDescrVal: string = "", longDescrVal: string = "") {
    let control = <FormArray>this.rewardForm.controls.descriptions;
    control.push(
      new FormGroup({
        lang : new FormControl(langVal, [Validators.required]),
        shortDescription : new FormControl(shoerDescrVal, [Validators.required, Validators.maxLength(30)]),
        longDescription : new FormControl(longDescrVal, [])
      })
    );
  }
  
  /**
   * Remove current description
   * 
   * @param index 
   */
  removeCurrentDescription(index) {
    let control = <FormArray>this.rewardForm.controls.descriptions;
    control.removeAt(index);
  }

  /**
   * Already used language validator
   * 
   * @param control 
   */
  alreadyUsedLanguageValidator(control: AbstractControl): { [key: string]: boolean } {
    var arrayControl = control as FormArray;
    var usedLanguages = [];
    for(var i=0; i<arrayControl.length; i++){
      var currDescriptionGroup = arrayControl.at(i) as FormGroup;
      var currLangControl = currDescriptionGroup.get("lang") as FormControl;
      var currLang = currLangControl.value;
      if (usedLanguages.includes(currLang)){
        currLangControl.setErrors(    // set error on duplicate lang control
          {
            languageAlreadyInUse: true
          }
        );
        // console.log("Lang ", currLang, " is already defined!");
        return {languageAlreadyInUse: true};
      }
      usedLanguages.push(currLang);
    }
    return null;
  }


  /**
   * Get available languages
   */
  getAvailableLanguages() {
    return this.surveyService.availableLanguages;
  }

  /**
   * Get available target types
   */
  getAvailableTargetTypes(){
    return Reward.getAvailableTargetTypes();
  }

  /**
   * Get control by name chain
   * 
   * @param controlNameChain 
   */
  private getControlByNameChain (controlNameChain) { // controlNameChain must have strings or objects
    var currControl : AbstractControl;
    currControl = this.rewardForm;
    controlNameChain.forEach(controlName => {
      if (typeof controlName === "string"){
        currControl = currControl.get(controlName);
      } else {  // object
        var tempCast = currControl as FormArray;
        currControl = tempCast.at(controlName.idx);
      }
      
    });
    return currControl;
  }

  /**
   * Control has errors
   * 
   * @param controlNameChain 
   */
  controlHasErrors(controlNameChain) {
    const control = this.getControlByNameChain(controlNameChain);
    return control.invalid;
  }

  /**
   * Get control error message
   * 
   * @param controlNameChain 
   */
  getControlErrorMessage(controlNameChain) {
    const control = this.getControlByNameChain(controlNameChain);
    if (control.errors.required) {
      return "Required";
    } else if (control.errors.maxlength) {
      return "Maximum " + control.errors.maxlength.requiredLength + " characters";
    } else if (control.errors.languageAlreadyInUse){
      return "Already defined";
    } else {
      return "Incorrect";
    }
  }

  /**
   * Requires start date
   * 
   * used onint only because it is not possible to edit the type of the reward
   */
  requiresStartDate(){
    if(this.rewardForm.get("target").get("type").value<4){
      this.rewardForm.get("startDate").enable();
      this.rewardForm.get("startDate").setValidators([Validators.required]);
      return true;
    }  
    this.rewardForm.get("startDate").disable();
    return false;
  }

  /**
   * Submit reward
   */
  submitReward() {
    var startDateObject = moment(this.rewardForm.get("startDate").value, moment.ISO_8601);

    var startDateTs=null;
    if(this.rewardForm.get("target").get("type").value<4){
      startDateTs = startDateObject.valueOf();
    }
    else{
      startDateTs = 0;
    }

    var endDateObject = moment(this.rewardForm.get("endDate").value, moment.ISO_8601);
    var endDateTs = endDateObject.valueOf();

    const arrayFormObj = this.rewardForm.get("descriptions") as FormArray;
    const defaultLanguage = arrayFormObj.at(0).get("lang").value;

    var descriptions = {};
    for (var i=0; i<arrayFormObj.length; i++){
      var currDescriptionForm = arrayFormObj.at(i);
      var currLang = currDescriptionForm.get("lang").value;
      var newDescription = {
        "shortDescription": currDescriptionForm.get("shortDescription").value,
        "longDescription": currDescriptionForm.get("longDescription").value
      };
      descriptions[currLang] = newDescription;
    }

    var rewardObject : Reward = new Reward(
      this.rewardToEdit.rewardId,
      this.rewardForm.get("rewardName").value,
      this.rewardForm.get("targetCampaignId").value,
      startDateTs,
      endDateTs,
      this.rewardForm.get("target").get("type").value,
      this.rewardForm.get("target").get("value").value,
      this.rewardForm.get("organizerName").value,
      this.rewardForm.get("linkToContact").value,
      this.rewardToEdit.removed,
      defaultLanguage,
      descriptions
    );

    console.log("Reward to submit: ", rewardObject);

    this.campaignService.editReward(rewardObject).then(resp => {
      console.log("Reward sent, resp: ", resp);
      alert('Reward updated successfully!');
      this.location.back();
    }).catch(error => {
      alert('Error: ' + error);
    });
  }
}