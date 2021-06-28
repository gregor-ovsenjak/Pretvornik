const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var fs = require('fs');
const { mainModule } = require("process");


class Converter {

    constructor(jsonFile) {

        this.parsedJsonData = require(jsonFile);
        this.level = 0
        this.element = null
    }

    /*
        main method to initialize the DOM
    */
    _initializeDOM() {
        // doctype and language initialization
        let doctype = this.parsedJsonData.doctype ? "<!DOCTYPE html>" : "";
        let language = this.parsedJsonData.language ? `lang = ${this.parsedJsonData.language}`  : "";
        // dom and document initialization
        this.dom = new JSDOM(`${doctype}<html ${language}></html>`);
        this.document = this.dom.window.document
        
    }



    /*
    Recursive functon that takes in the object argument 
    and recursively fills the body tag with the 
    nested element tags.
    */
    eachRecursive(obj)
    {
            
            for (var k in obj)
            {   
                // add HTML TAGS on the first level of recursion
                // ignore any attributes of a HTML Tag
                if (this.level === 0  && k!= "attributes"){
                    
                    this.element = this.document.createElement(`${k}`)
                    if (typeof obj[k] === "string"){
                        this.element.innerHTML = obj[k]
                        this.document.body.appendChild(this.element)
                    }                    
                }
                // go into deeper levels of nested HTML tags
                if (typeof obj[k] == "object" && (k !== "attributes") && k!= "style"){
                    let element2 = this.element
                    this.element = this.document.createElement(`${k}`)
                    //console.log(element2,this.element)
                    element2.appendChild(this.element)
                    // count which level you are on
                    //one level down
                    this.level += 1
                    this.eachRecursive(obj[k]);
                    // one level up
                    this.level += -1
                    this.element = element2
                    // add final HTML tags that are properly nested to inner HTML of body
                    // works for any number of indentations
                    // if statement included because it should append only the last version 
                    
                    if (this.level ===0){
                        this.document.body.innerHTML += this.element.innerHTML
                    }
                    
                }
                else {
                    // add attributes to the current html element/tag 
                    if (this.level > 0 && this.element != null){
                        if (typeof obj[k] == "object" && obj[k] !== null){
                            if (k == "attributes" && obj[k] !== null){
                                // add attributes
                                this.Attributes(obj[k])
                            }     
                        }
                        // add the most nested html tags
                        else if (typeof obj[k] == "string" && obj[k] !== null){
                            let element1 = this.document.createElement(`${k}`);
                            element1.innerHTML = obj[k]
                            this.element.appendChild(element1)
                        } 
                    }
                }
        }
    }



    Attributes(obj) {
        for (var k in obj){
            
            if (typeof obj[k]=="object"){
                
                let string = this.stringifyObject(obj[k])
                this.element.setAttribute(k,string);
            }else{
                
                this.element.setAttribute(k,obj[k]);
            }
            
        }
    }


    /* helper method to stringify the json object and use regex to replace
       string characters
    */
    stringifyObject(object){
        let string = JSON.stringify(object).replace(/"/g,"")
                                           .replace(/:/g,":")
                                           .replace(/[{}]/g,"")
                                           .replace(/,/g,"; ")
        return (string)
    }


    /*
        helper method to add meta tags to the head tag
    */
    Meta() {

        let meta = this.parsedJsonData.head.meta ? this.parsedJsonData.head.meta : null;
        if (meta!= null){
            for (var key in meta){
                let metaTag = this.document.createElement('meta');
                metaTag.name = key;
                metaTag.content = typeof meta[key] === 'string' ? meta[key] : this.stringifyObject(meta[key]) ;
                this.document.head.appendChild(metaTag);
            }
        }else {
            console.log("Meta tags not found.")
        }
        
    }


    /*
        helper method to add link tags to the head tag
    */
    Link() {
        let links = this.parsedJsonData.head.link ? this.parsedJsonData.head.link : null;
        if (links != null) {
            links.forEach((items, index) => {
                let link = this.document.createElement('link');
                for (var key in items){
                    link.setAttribute(`${key}`,`${items[key]}`)
                    
                }
                this.document.head.appendChild(link)
                })
        }else{
            console.log("Link tags not found.")
        }
    }


    /*
        helper method to add title tag to the head tag
    */
    Title() {
        let title = this.parsedJsonData.head.title ? this.parsedJsonData.head.title : null;
        if (title != null) {
            let titleTag = this.document.createElement('title')
            titleTag.innerHTML = title
            
            this.document.head.appendChild(titleTag)
        }else{
            console.log(" Title tag Not found.")
        }
    }


    // main method to fill the head
    _populateHead() {
        this.Meta()
        this.Link()
        this.Title()
    }


    // main method to fill the body
    _populateBody() {
        let body = this.parsedJsonData.body
        this.eachRecursive(body)
        
        if (body.attributes){
            this.element = this.document.body
            this.Attributes(body.attributes)
        }

        
    }

    
}



function main(path){
    Convert = new Converter(path)
    Convert._initializeDOM()
    Convert._populateHead()
    Convert._populateBody()

    fs.writeFile(`./generatedHTML/${Convert.parsedJsonData.head.title.replace(/ /g, "")}.html`,
                 Convert.dom.serialize(),
                  function(err) {
                    if(err) {
                        return console.log(err);
                    }

                    console.log("The file was saved!");
                }
        ); 
}



main(path="./Json/helloWorld2.json")