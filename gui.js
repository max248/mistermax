window.addEventListener("load",function(){
	document.getElementById("source").innerHTML="var a,b:integer;\nbegin\nend;"

	// Транслятор
	 var source = document.getElementById("source").value.split('\n'); 
	 var translator = new Translator(source);  
	 // Вывод 
	document.getElementById("output").innerHTML = translator.Source;


}

	)