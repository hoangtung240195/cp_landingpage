
(function () {
    let isVerifyCaptcha = false;
    let isAcceptPolicy = false;

    const config = {
        apiKey: "AIzaSyCphd7p-BHxKBj9Xaxk85ilcYYRm-HCC-Q",
        authDomain: "cloudjet-work.firebaseapp.com",
        databaseURL: "https://cloudjet-work.firebaseio.com",
        projectId: "cloudjet-work",
        appId: "1:736915700044:web:73ae17b3efdec4b3"
    };
    firebase.initializeApp(config);
    const Auth = firebase.auth();
    const Firestore = firebase.firestore();
    CJPModels.init(Firestore, Auth);

    window.verifySuccess = function(response) {
        isVerifyCaptcha = true;
        if (isAcceptPolicy && isVerifyCaptcha) {
            $("#submit").removeAttr("disabled");
        } else {
            $("#submit").attr("disabled", "");
        }
    }

    const { User, Company } = CJPModels;

    $(document).ready(() => {
        $("#accept-policy").on("change", function () {
            isAcceptPolicy = $(this)[0].checked;
            
            if (isAcceptPolicy && isVerifyCaptcha) {
                $("#submit").removeAttr("disabled");
            } else {
                $("#submit").attr("disabled", "");
            }
        });

        $.validator.addMethod('pwcheck', function(value, element, params) {
            return this.optional(element) || 
                (typeof value === "string" 
                && value.match(/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/));
        }, "Mật khẩu phải chứa ít nhất 1 kí tự thường, 1 kí tự in hoa và 1 chữ số");

        $.validator.addMethod('phone', function(value, element, params) {
            return this.optional(element) || 
                (typeof value === "string" 
                && value.match(/^([0-9]{10})|(\([0-9]{3}\)\s+[0-9]{3}\-[0-9]{4})$/));
        }, "Số điện thoại không hợp lệ");

        const validator = $("#signup-form").validate({
            rules: {
                name: {
                    required: true,
                    normalizer(val) {
                        return $.trim(val);
                    }
                },
                company_name: {
                    required: true,
                    normalizer(val) {
                        return $.trim(val);
                    }
                },
                email: {
                    required: true,
                    email: true
                },
                phone: {
                    required: true,
                    phone: true,
                },
                password: {
                    required: true,
                    minlength: 6,
                    pwcheck: true,
                }
            },
            messages: {
                name: "Họ tên không được để trống",
                company_name: "Tên Công ty không được để trống",
                email: {
                    required: "Email không thể để trống",
                    email: "Email không hợp lệ",
                },
                password: {
                    required: "Mật khẩu không được để trống",
                    minlength: "Mật khẩu phải dài hơn 5 kí tự"
                },
                phone: {
                    required: "Bạn cần nhập số điện thoại",
                }
            },
            submitHandler(form) {
                const {
                    email,
                    company_name,
                    company_website,
                    name,
                    password
                } = form.elements;


                submiting();
                (async () => {
                    try {
                        // check email exist
                        const users = await User.instance().find([
                            {
                                field: 'email', op: '==', value: email.value,
                            }
                        ]);
                        if (users.length) {
                            validator.showErrors({
                                email: "Email này đã tồn tại trong hệ thống"
                            });
                            return;
                        }

                        // create user
                        const fuser = await Auth.createUserWithEmailAndPassword(email.value, password.value);

                        // create user
                        user = new User();
                        Object.assign(user, {
                            id: fuser.user.uid,
                            email: email.value,
                            name: name.value,
                            role: User.ROLE.ADMIN,
                            status: "1",
                        });
                        await user.insert();

                        // Then Create company
                        company = await Company.create({
                            name: company_name.value,
                            website: company_website.value || "",
                        });

                        user.company_id = company.id;
                        await user.update();

                        await Auth.signOut();

                        window.location.href = 'https://pro.cloudjetpotential.com/login?email=' + email.value;
                    } catch (e) {
                        alert(e + "");
                        console.error({e});
                    } finally {
                        submiting(false);
                    }
                })();
            }
        });
    });
})();

function submiting(val = true) {
    const els = $('#signup-form').find('input, button');
    if (val) {
        $('#loading').show();
        els.attr('disabled', '');
    } else {
        $('#loading').hide();
        els.removeAttr('disabled');
    }
}