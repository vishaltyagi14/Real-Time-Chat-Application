
if (typeof document !== 'undefined') {
    const otpFields=document.querySelectorAll(".num")
    let otp="";
    otpFields.forEach((field,index)=>{
        field.addEventListener('input',(e)=>{
              field.value = field.value.replace(/[^0-9]/g, "");
            if(field.value.length===1 && index<otpFields.length-1){
                otpFields[index+1].focus();
            }
        })
        field.addEventListener('keydown',(e)=>{
            if(e.key==="Backspace" && field.value==="" && index>0){
                otpFields[index-1].focus();
            }
        })
    })

    let verifyBtn= document.querySelector("#submit");
    verifyBtn.addEventListener('click',async ()=>{
        otpFields.forEach(input=>{
            otp+=input.value;
        })
        const response= await fetch('/verifyOtp',{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
             body: JSON.stringify({ otp: otp })
        })
        const data = await response.json();
        if (data.success) {
            window.location.href = '/chat';
        } else {
            alert("Wrong OTP ❌");
        }
    })
}