from typing import TypeVar, Generic, Type, Any, Optional
from django.db.models import Model, QuerySet

ModelType = TypeVar('ModelType', bound=Model)

class SafeModelManager(Generic[ModelType]):
    def __init__(self, model_class: Type[ModelType]):
        self._model_class = model_class

    def all(self) -> QuerySet[ModelType]:
        # Safely access the objects manager
        return getattr(self._model_class, 'objects').all()

    def filter(self, *args: Any, **kwargs: Any) -> QuerySet[ModelType]:
        return getattr(self._model_class, 'objects').filter(*args, **kwargs)

    def get(self, *args: Any, **kwargs: Any) -> ModelType:
        return getattr(self._model_class, 'objects').get(*args, **kwargs)

    def select_related(self, *fields: str) -> QuerySet[ModelType]:
        # Pass through select_related to the objects manager
        return getattr(self._model_class, 'objects').select_related(*fields)

    @property
    def objects(self) -> QuerySet[ModelType]:
        """
        Provide direct access to the model's objects manager
        """
        return getattr(self._model_class, 'objects')

def get_safe_manager(model_class: Type[ModelType]) -> SafeModelManager[ModelType]:
    return SafeModelManager(model_class)
