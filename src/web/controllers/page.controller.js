const path = require("path");
const pageService = require("../../shared/services/page.service");
const marked = require("marked");
const fs = require("fs");
const { promisify } = require("util");
const readFileAsync = promisify(fs.readFile);
const { PageNotFound } = require("../../shared/errors/all.errors");

exports.getPage = async (req, res, next) => {
    const routeWhitelist = [
        "repere-istorice",
        "elevi-de-prestigiu",
        "ziua-portilor-deschise",
        "planul-de-scolarizare",
        "circumscriptie",
        "criterii-specifice-de-departajare",
        "orarul-pentru-inscriere",
        "acte-necesare-pentru-inscriere",
        "procedura-de-repartizare-pe-clase",
        "scoala-dupa-scoala",
        "imagini-din-clase",
        "metodologie-evaluare-nationala",
        "calendar-evaluare-nationala",
        "rezultate-simulare-evaluare-nationala",
        "rezultate-evaluare-nationala",
        "personal-auxiliar",
        "comisii",
        "clase",
        "orar-elevi",
        "transfer-elevi",
        "rezultate-olimpiade",
        "burse-elevi",
        "revista-scolii",
        "eco-scoala",
        "biblioteca",
        "hotarari-ca",
        "achizitii-publice",
        "cheltuieli-asociatie-parinti",
        "rapoarte",
        "anunturi"
    ];

    const pageId = req.params.pageId;

    if (!routeWhitelist.includes(pageId)) {
        const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
        return next(err);
    }

    // const pageId = "5c3258b8b3a6dc56c06a6e7d";

    // const filePath = path.join(__dirname, "../public/test.md");

    // const page1Md = await readFileAsync(filePath, "utf-8");

    // const page1: IPage = {
    //     markdownContent: page1Md,
    //     htmlContent: marked(page1Md),
    // };

    // await pageService.insertOne(page1);

    // daca vrei sa editezi extern string-ul de markdown din mongo:
    // 1. copiezi sirul intr-un fisier (cu extensia md) din VSCode
    // 2. rulezi "Find and Replace din VSCode: Mondul regex, find=\\n, replace = \n
    // 3. dupa ce ai terminat de editat, refaci string-ul tot cu Find and Replace: \n -> \\n

    const page = await pageService.getOneBySlug(pageId);

    const data = {
        //ctx: req.ctx,
        pageContent: (page && page.htmlContent) || "pagina negasita"
    };

    res.render("page", data);

    // fs.readFile(filePath, "utf-8", (err, pageContentMd) => {
    //     if (err) {
    //         console.error(err);
    //         return;
    //     }

    //     const page: IPage = {
    //         content: pageContentMd,
    //     };

    //     // await pageService.insertOne(page);

    //     const pageContentHtml = marked(pageContentMd);

    //     // console.log(pageContentHtml);

    //     var data = {
    //         ctx: req.ctx,
    //         pageContent: pageContentHtml,
    //     };

    //     res.render("page", data);
    // });
};

exports.getPage2 = async (req, res, next) => {
    const routeWhitelist = [
        "repere-istorice",
        "elevi-de-prestigiu",
        "ziua-portilor-deschise",
        "planul-de-scolarizare",
        "circumscriptie",
        "criterii-specifice-de-departajare",
        "orarul-pentru-inscriere",
        "acte-necesare-pentru-inscriere",
        "procedura-de-repartizare-pe-clase",
        "scoala-dupa-scoala",
        "imagini-din-clase",
        "metodologie-evaluare-nationala",
        "calendar-evaluare-nationala",
        "rezultate-simulare-evaluare-nationala",
        "rezultate-evaluare-nationala",
        "personal-auxiliar",
        "comisii",
        "clase",
        "orar-elevi",
        "transfer-elevi",
        "rezultate-olimpiade",
        "burse-elevi",
        "revista-scolii",
        "eco-scoala",
        "biblioteca",
        "hotarari-ca",
        "achizitii-publice",
        "cheltuieli-asociatie-parinti",
        "rapoarte",
        "anunturi"
    ];

    const pageId = req.params.pageId;

    if (!routeWhitelist.includes(pageId)) {
        const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
        return next(err);
    }

    // const pageId = "5c3258b8b3a6dc56c06a6e7d";

    const filePath = path.join(__dirname, `../public/pages/${pageId}.md`);

    const page1Md = await readFileAsync(filePath, "utf-8");

    // const page1: IPage = {
    //     markdownContent: page1Md,
    //     htmlContent: marked(page1Md),
    // };

    // await pageService.insertOne(page1);

    // daca vrei sa editezi extern string-ul de markdown din mongo:
    // 1. copiezi sirul intr-un fisier (cu extensia md) din VSCode
    // 2. rulezi "Find and Replace din VSCode: Modul regex, find=\\n, replace = \n
    // 3. dupa ce ai terminat de editat, refaci string-ul tot cu Find and Replace: \n -> \\n

    const page = await pageService.getOneBySlug(pageId);

    page.markdownContent = page1Md;
    page.htmlContent = marked(page1Md);

    // better way to extend marked
    // https://stribny.name/blog/2018/10/convert-markdown-text-to-html-and-to-plaintext-in-javascript
    page.htmlContent =
        // page.htmlContent && page.htmlContent.replace(`/<table>/g`, `<table class="table-sm table-bordered">`);
        // eslint-disable-next-line quotes
        page.htmlContent && page.htmlContent.split("<table>").join('<table class="table table-sm table-bordered">');
    // console.log(page);

    await pageService.updateOne(page);

    const data = {
        // ctx: req.ctx,
        pageContent: (page && page.htmlContent) || "pagina negasita"
    };

    res.render("page", data);

    // fs.readFile(filePath, "utf-8", (err, pageContentMd) => {
    //     if (err) {
    //         console.error(err);
    //         return;
    //     }

    //     const page: IPage = {
    //         content: pageContentMd,
    //     };

    //     // await pageService.insertOne(page);

    //     const pageContentHtml = marked(pageContentMd);

    //     // console.log(pageContentHtml);

    //     var data = {
    //         ctx: req.ctx,
    //         pageContent: pageContentHtml,
    //     };

    //     res.render("page", data);
    // });
};
