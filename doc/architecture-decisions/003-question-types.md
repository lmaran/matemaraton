# Valorile posibile pentru câmpul "questionType"

## Inspirație / Alternative

-   [Clasificarea itemilor](https://github.com/adr/madr)
-   [Google Forms Question Types](https://howtogapps.com/google-forms-question-types/)
-   [Aplicația ASQ](https://app.asq.ro/)
-   [Upper - model pentru exerciții cu răspuns scurt](https://app.upper.school/UpperSchool.2021.Etapa2.Solutii.Clasa.5_v2.pdf)
-   [Answer types you can use in the Simple Editor](https://help.pearsoncmg.com/mastering/instructor/ccng/Topics/my_se_answer_types.htm)

## Decizia

-   fieldName: questionType (UI: "tipul exercițiului")
-   fieldValues:

    -   "multipleChoice" (UI: "cu alegere multiplă")
    -   "shortAnswer" (UI: cu răspuns scurt")
    -   "openAnswer" (UI: "cu răspuns deschis")

-   Ex: questionType: "multipleChoice"

## Observații

-   Cele 3 tipuri alese corespund celor 3 categorii de itemi (obiectivi, semiobiectivi și subiectivi).
-   Fiecare question type poate avea și alte atribute asociate:
    -   Ex.1: multipleChoice poate fi cu selecție unică (radio button) sau selecție multiplă (checkbox)
    -   Ex.2: shortAnswer poate fi cu răspuns de tip text sau numeric (exact, calculabil)
    -   Ex.3: openAnswer poate fi cu răspuns de tip text, imagine sau ambele
