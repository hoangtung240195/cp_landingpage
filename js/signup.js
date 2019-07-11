(function () {
    const config = {
        apiKey: "AIzaSyAmaUlIFpaBnzX45MYJ2LjVV7GrgTNti8E",
        authDomain: "just-landing-229509.firebaseapp.com",
        databaseURL: "https://just-landing-229509.firebaseio.com",
        projectId: "just-landing-229509",
        storageBucket: "just-landing-229509.appspot.com",
        messagingSenderId: "512260630417",
        appId: "1:512260630417:web:ccb7e3d2324325b6"
    };
    firebase.initializeApp(config);
    const Auth = firebase.auth();
    const Firestore = firebase.firestore();
    CJPModels.init(Firestore);

    const { User, Company } = CJPModels;

    $(document).ready(() => {
        $("#accept-policy").on("change", function () {
            if ($(this)[0].checked) {
                $("#submit").removeAttr("disabled");
            } else {
                $("#submit").attr("disabled", "");
            }
        });

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
                password: {
                    required: true,
                    min: 6
                }
            },
            messages: {
                name: "Họ tên không được để trống",
                company_name: "Tên Công ty không được để trống",
                email: {
                    required: "Email không thể để trống",
                    email: "Email không hợp lệ"
                },
                password: {
                    required: "Mật khẩu không được để trống",
                    min: "Mật khẩu phải dài hơn 5 kí tự"
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
                            email: email.input,
                            name: name.input,
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

                        await fauth.signOut();
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